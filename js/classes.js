var actual_JSON;
var flatClasses = [];
var classesNow;
//var now = moment('09:10 am', 'hh:mm a');
//var weekDay = 1;

var now = moment();
var weekDay = now.format('d');

var after15mins = moment(now).add(16, 'minutes');
var after30mins = moment(now).add(31, 'minutes');
var before30mins = moment(now).subtract(31, 'minutes');
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

    var startItem = 0;
    var itemsPerPage = 8;
    var currentPage = 1;


    setInterval(function render() {
      setDateTime();
      classesNow = flatClasses.filter(function (i) {
        return (i.start.isBetween(before30mins, after30mins) && (i.Days === weekDay))
      }).sort(compare);
      var totalItems = classesNow.length;
      var totalPages = Math.ceil(totalItems / itemsPerPage);

      if (classesNow.length === 0) {
        image('img/screen.jpg');
      } else {

        //console.log(startItem)
        renderLessons(startItem, startItem + itemsPerPage);
        startItem += itemsPerPage;

        document.getElementById("page").innerHTML = currentPage + "/" + totalPages;
        currentPage++;
        if (startItem >= classesNow.length) startItem = 0;
        if (currentPage > totalPages) currentPage = 1;
      }
      return render;
    }(), 5000);
  });
}

function test(num){
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
    console.log()
    return 'starts in 5 mins';
  } else if (start.diff(now, 'minutes') <= 10) {
    return 'starts in 10 mins';
  } else if (start.diff(now, 'minutes') <= 15) {
    return 'starts in 15 mins';
  } else if (start.diff(now, 'minutes') <= 30) {
    return 'starts in 30 mins';
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
  hide("screen");
  show("table");
  document.getElementById("lessons").innerHTML = "";
  var classes = classesNow.slice(startItem, lastItem);
  var rows = classes.map(d => renderLesson(getLesson(d))).join('');
  document.getElementById("lessons").innerHTML = rows;
}

function setDateTime() {
  document.getElementById("date").innerHTML = now.format('DD/MM/YYYY');
  document.getElementById("time").innerHTML = now.format('HH:mm');
}

init();
