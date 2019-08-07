var actual_JSON;

var startItem = 0;
var itemsPerPage = 8;
var currentPage = 1;

function loadJSON(callback) {
  var xobj = new XMLHttpRequest();
  xobj.overrideMimeType("application/json");
  xobj.open('GET', 'data.json', true); // Replace 'my_data' with the path to your file
  xobj.onreadystatechange = function () {
    if (xobj.readyState == 4 && xobj.status == "200") {
      // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
      callback(xobj.responseText);
    }
  };
  xobj.send(null);
}

/*
 1. load json
 2. flatten items
 -- every 5 seconds --
 3. Get time and weekday
 4. filter based on days and time
 5. Clean the pool
 6. Render
 */

function init() {

  loadJSON(function (response) {
    // Parse JSON string into object
    actual_JSON = JSON.parse(response);


    setInterval(function render() {

      var time = getTime();
      var data = filterClasses(getFlatClasses(actual_JSON), time);
      paginate(data);

      return render;
    }(), 5000);
  });
}

function getFlatClasses(loadedJson) {
  var flatClasses = [];
  loadedJson.forEach(function (item) {
    item.classes.forEach(
      function (section) {
        var lesson = Object.assign({}, item);
        delete lesson.classes;
        section.weekDay = getWeekNumber(section.Days);
        section.start = getStart(section.Time);
        section.end = getEnd(section.Time);
        flatClasses.push(Object.assign(lesson, section));
      }
    )
  });
  return flatClasses;
}

function filterClasses(classes, time) {
  var filteredClasses = [];
  classes.forEach(
    function (i) {
      if (i.start.isBetween(time.start, time.end) && (i.weekDay == time.weekDay)) {
        i.status = getStatus(i.start, time.end, time.now);
        filteredClasses.push(i);
      }
    }
  );
  return filteredClasses.sort(compare);
}

function getTime() {
  var now = moment();
  setDateTime(now);
  return {
    "now": now,
    "start": moment(now).subtract(31, 'minutes'),
    "end": moment(now).add(31, 'minutes'),
    "weekDay": parseInt(now.format("d"))
  }
}

function paginate(classes) {
  if (classes.length === 0) {
    image('img/screen.jpg');
  } else {

    var totalItems = classes.length;
    var totalPages = Math.ceil(totalItems / itemsPerPage);

    renderLessons(classes, startItem, startItem + itemsPerPage);
    startItem += itemsPerPage;

    document.getElementById("page").innerHTML = currentPage + "/" + totalPages;
    currentPage++;
    if (startItem >= classes.length) startItem = 0;
    if (currentPage > totalPages) currentPage = 1;
  }
}

function test(num) {
  weekDay = num || 1;
}

function compare(a, b) {
  if (a.start.isBefore(b.start)) {
    return -1;
  }
  if (a.start.isAfter(b.start)) {
    return 1;
  }
  return 0;
}

function image(imgName) {
  var imageDiv = document.getElementById("screen");
  imageDiv.innerHTML = "";
  show("screen");
  hide("table");
  //dynamically add an image and set its attribute
  var img = document.createElement("img");
  img.src = imgName;
  img.id = "image";
  imageDiv.appendChild(img);
}

function hide(tag) {
  document.getElementById(tag).style.display = "none";
  ;
}

function show(tag) {
  document.getElementById(tag).style.display = "flex";
  ;
}

function getStart(timeString) {
  return moment(timeString.split(' - ')[0], "HH:mm a");
}

function getEnd(timeString) {
  return moment(timeString.split(' - ')[1], "HH:mm a");
}

function getWeekLetter(weekNumber) {
  var days = "UMTWRFS";
  return days[weekNumber];
}

function getWeekNumber(weekLetter) {
  var days = "UMTWRFS";
  return days.indexOf(weekLetter);
}

function getStatus(start, end, now) {
  if (now.isBetween(start, end) || (now.diff(start, 'minutes') === 0)) {
    return 'started';
  } else if (start.diff(now, 'minutes') <= 5) {
    return 'starts in 5 mins';
  } else if (start.diff(now, 'minutes') <= 10) {
    return 'starts in 10 mins';
  } else if (start.diff(now, 'minutes') <= 15) {
    return 'starts in 15 mins';
  } else if (start.diff(now, 'minutes') <= 30) {
    return 'starts in 30 mins';
  } else {
    return "";
  }
}

function getLesson(section) {
  return {
    "starts": section.start.format('HH:mm'),
    "ends": section.end.format('HH:mm'),
    "code": section.code,
    "lesson": section.name,
    "section": section.section,
    "instructor": section.Instructors,
    "faculty": getFacultyShortname(section.Where),
    "room": section.Where == 'TBA' ? 'TBA' : section.Where.substr(section.Where.lastIndexOf(' ')),
    "remark": section.status,
  };
}

function getFacultyShortname(facultyText) {
  if (facultyText.toLowerCase().indexOf('arts') !== -1) {
    return 'FASS';
  }
  if (facultyText.toLowerCase().indexOf('engin') !== -1) {
    return 'FENS';
  }
  if (facultyText.toLowerCase().indexOf('management') !== -1) {
    return 'FMAN';
  }
  if (facultyText.toLowerCase().indexOf('languages') !== -1) {
    return 'LANG';
  }
  return 'TBA';
}

function renderLesson(section) {
  var x, txt = "";
  txt += "<tr>"
  for (x in section) {
    var banner = x.toLowerCase();
    if (section[x].indexOf('5 mins') !== -1) banner = 'alert';
    if (section[x].indexOf('10 mins') !== -1) banner = 'warning';
    if (section[x].indexOf('15 mins') !== -1) banner = 'clear';
    if (section[x].indexOf('started') !== -1) banner = 'alert';
    var span = '<span class="' + banner + '">';
    var spanClose = '</span>';
    txt += "<td>" + span + section[x] + spanClose + "</td>";
  }
  txt += "</tr>"
  return txt;
}

function renderLessons(allClasses, startItem, lastItem) {
  hide("screen");
  show("table");
  document.getElementById("lessons").innerHTML = "";
  var classes = allClasses.slice(startItem, lastItem);
  var rows = classes.map(d => renderLesson(getLesson(d))).join('');
  document.getElementById("lessons").innerHTML = rows;
}

function setDateTime(now) {
  document.getElementById("date").innerHTML = now.format('DD/MM/YYYY');
  document.getElementById("time").innerHTML = now.format('HH:mm');
}

init();
