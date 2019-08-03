var actual_JSON;
var flatClasses = [];
var classesNow;
var now = moment('9:34 am', 'h:mm a');

//var weekDay = parseInt(now.format('d'));
var weekDay = 0;

var after15mins = moment(now).add(16, 'minutes');
var after30mins = moment(now).add(30, 'minutes');
var before15mins = moment(now).subtract(16, 'minutes');

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

function init() {
  loadJSON(function (response) {
    // Parse JSON string into object
    actual_JSON = JSON.parse(response);
    actual_JSON.forEach(function (item) {
      item.classes.forEach(function (section) {
        var lesson = Object.assign({}, item);
        delete lesson.classes;

        section.Days = getWeekNumber(section.Days);
        section.start = getStart(section.Time);
        section.end = getEnd(section.Time);

        section.status = getStatus(section.start, section.end, now);

        flatClasses.push(Object.assign(lesson, section));

      })
    });
    classesNow = flatClasses.filter(function (i) {
      return (i.start.isBetween(before15mins, after15mins) && (i.Days == weekDay))
    });
    setDateTime();

    var startItem = 0;
    var totalItems = 32;
    var itemsPerPage = 8;
    var currentPage = 1;

    var totalPages = Math.ceil(totalItems / itemsPerPage);

    setInterval(function render() {
      //console.log(startItem)
      renderLessons(startItem, startItem + itemsPerPage);
      startItem += itemsPerPage;

      document.getElementById("page").innerHTML = currentPage + "/" + totalPages;
      currentPage++;
      if (startItem  >= totalItems) startItem = 0;
      if (currentPage  > totalPages) currentPage = 1;
      return render;
    }(), 5000);
  });
}

function getStart(timeString) {
  return moment(timeString.split(' - ')[0], "h:mm a");
}

function getEnd(timeString) {
  return moment(timeString.split(' - ')[1], "h:mm a");
}

function getWeekLetter(weekNumber) {
  var days = "MTWRFSU";
  return days[weekNumber];
}

function getWeekNumber(weekLetter) {
  var days = "MTWRFSU";
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
  }
}

function getLesson(section) {
  return {
    "starts": section.start.format('hh:mm'),
    "ends": section.end.format('hh:mm'),
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
  var section, x, txt = "";
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

function renderLessons(startItem, lastItem) {
  document.getElementById("lessons").innerHTML = "";
  var classes = classesNow.slice(startItem, lastItem);
  var rows = classes.map(d => renderLesson(getLesson(d))).join('');
  document.getElementById("lessons").innerHTML = rows;
}

function setDateTime() {
  document.getElementById("date").innerHTML = now.format('DD/MM/YYYY');
  document.getElementById("time").innerHTML = now.format('hh:mm');
}

init();
