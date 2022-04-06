var parser = module.require("osuparser");
var format = module.require('format');

//const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

module.export("osu_to_json", function(osu_file_contents) {
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

			/*append_to_output(format("--ERROR: Note overlapping another. At time (%s), track(%d). (Note type(%s) number(%d))",
				msToTime(start_time),
				track,
				type,
				i
			))*/

			_i_to_removes[i] = true
			continue
		} else {
			_tracks_next_open[track] = start_time
		}

		if (type == "slider") {
			var end_time = start_time + itr.duration
			if (_tracks_next_open[track] >= end_time) {
				/*append_to_output(format("--ERROR: Note overlapping another. At time (%s), track(%d). (Note type(%s) number(%d))",
					msToTime(start_time),
					track,
					type,
					i
				))*/

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
	
	var convertBeatmap = {
        Info: {
            Mapper: beatmap.Creator,
            DifficultyTitle: beatmap.Version
        },
        Notes: [],
        TimingPoints: [],
        SliderVelocities: []
    }

	for (var i = 0; i < beatmap.hitObjects.length; i++) {
		var itr = beatmap.hitObjects[i];
		var type = itr.objectName;
		var track = hitobj_x_to_track_number(itr.position[0]);
		var duration = itr.duration;
		if (!isNaN(duration)) duration /= 1000;
		else duration = 0;
        convertBeatmap.Notes.push({Key: track, Time: itr.startTime / 1000, Length: duration});
	}
	// Get the timing points.
	var timingPoints = [];
	var SVsPoints = [];
	
	for (var i = 0; i < beatmap.timingPoints.length; i++) {
		var itr = beatmap.timingPoints[i];
		if (itr.inherited == 0 || itr.beatLength < 0)
			SVsPoints.push(itr);
		else
			timingPoints.push(itr);
	}
	
	if (timingPoints.length > 0) {
		for (var i = 0; i < timingPoints.length; i++) {
			var itr = timingPoints[i];
            convertBeatmap.TimingPoints.push({Offset: itr.offset/1000, BeatLength: itr.beatLength});
		}
	}
	
	if (SVsPoints.length > 0) {
		for (var i = 0; i < SVsPoints.length; i++) {
			var itr = SVsPoints[i];
            convertBeatmap.SliderVelocities.push({StartTime: itr.offset/1000, Multiplier: itr.velocity});
		}
	}

	return JSON.stringify(convertBeatmap);
})
