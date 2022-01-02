var parser = module.require("osuparser");
var format = module.require('format');

module.export("osu_to_lua", function(osu_file_contents) {
	var rtv_lua = ""
	var append_to_output = function(str, newline) {
		if (newline === undefined || newline === true)
		{
			rtv_lua += (str + "\n")
		}
		else
		{
			rtv_lua += (str)
		}
	}

	var beatmap = parser.parseContent(osu_file_contents)

	function track_time_hash(track,time) {
		return track + "_" + time
	}

	function hitobj_x_to_track_number(hitobj_x) {
		var track_number = 1;
		if (hitobj_x < 100) {
			track_number = 1;
		} else if (hitobj_x < 200) {
			track_number = 2;
		} else if (hitobj_x < 360) {
			track_number = 3;
		} else {
			track_number = 4;
		}
		return track_number;
	}

	function msToTime(s) {
		var ms = s % 1000;
		s = (s - ms) / 1000;
		var secs = s % 60;
		s = (s - secs) / 60;
		var mins = s % 60;
		var hrs = (s - mins) / 60;
		return hrs + ':' + mins + ':' + secs + '.' + ms;
	}

	var _tracks_next_open = {
		1 : -1,
		2: -1,
		3: -1,
		4: -1
	}
	var _i_to_removes = {}

	for (var i = 0; i < beatmap.hitObjects.length; i++) {
		var itr = beatmap.hitObjects[i];
		var type = itr.objectName;
		var track = hitobj_x_to_track_number(itr.position[0]);
		var start_time = itr.startTime

		if (_tracks_next_open[track] >= start_time) {

			append_to_output(format("--ERROR: Note overlapping another. At time (%s), track(%d). (Note type(%s) number(%d))",
				msToTime(start_time),
				track,
				type,
				i
			))

			_i_to_removes[i] = true
			continue
		} else {
			_tracks_next_open[track] = start_time
		}

		if (type == "slider") {
			var end_time = start_time + itr.duration
			if (_tracks_next_open[track] >= end_time) {
				append_to_output(format("--ERROR: Note overlapping another. At time (%s), track(%d). (Note type(%s) number(%d))",
					msToTime(start_time),
					track,
					type,
					i
				))

				_i_to_removes[i] = true
				continue
			} else {
				_tracks_next_open[track] = end_time
			}

		}
	}

	beatmap.hitObjects = beatmap.hitObjects.filter(function(x,i){
		return !(_i_to_removes[i])
	})

	append_to_output("return {");
	append_to_output("	Data = {");
	append_to_output("--The name of your map.")
	append_to_output(format("		Name = '%s',",beatmap.Title))
	append_to_output("--The difficulty number of your map.")
	append_to_output(format("		Difficulty = %d,",1))
	append_to_output("--Your name.")
	append_to_output(format("		Mapper = '%s',","MAPPER_NAME_HERE"))
	append_to_output("--Your map OD.")
	append_to_output(format("		OD = %d,",5))
	append_to_output("--Song BPM.")
	append_to_output(format("		BPM = %d,",69420))
	append_to_output("--How HP will changes based on the accuracy.")
	append_to_output("		HP = { -- HP = 100");
	append_to_output("			Heal = {");
	append_to_output(format("				Max = %d,",5));
	append_to_output(format("				Normal = %d",3));
	append_to_output("			},");
	append_to_output(format("			Damage = %d", 1));
	append_to_output("	},");
	append_to_output("--Your audio assetid should be in the form of \"rbxassetid://...\". Upload audios at \"https://www.roblox.com/develop?View=3\", and copy the uploaded id from the URL.")
	append_to_output(format("		Song = \"%s\"","rbxassetid://FILL_IN_AUDIO_ASSETID_HERE"));
	append_to_output("	},");
	
	append_to_output("	Map = {");
	append_to_output("--")

	for (var i = 0; i < beatmap.hitObjects.length; i++) {
		var itr = beatmap.hitObjects[i];
		var type = itr.objectName;
		var track = hitobj_x_to_track_number(itr.position[0]);
		var beat = 60 / (beatmap.timingPoints[0] / 1000);
		append_to_output(format("			{Key=%d,Beat=%d,Length=%d},", track, itr.startTime / 1000 * beat, itr.duration))
		/*
		if (type == "slider") {
			append_to_output(format("hold(%d,%d,%d) ", itr.startTime * beat, track, itr.duration))
		} else {
			append_to_output(format("note(%d,%d) ",itr.startTime, track))
		}
		*/
	}
	append_to_output("--")
	/*
	append_to_output("rtv.TimingPoints = {")
	for (var i = 0; i < beatmap.timingPoints.length; i++) {
		var itr = beatmap.timingPoints[i];
		append_to_output(format("\t[%d] = { Time = %d; BeatLength = %d; };",i+1, itr.offset, itr.beatLength))
	}
	*/
	append_to_output("}");
	//append_to_output("return rtv")

	return rtv_lua
})
