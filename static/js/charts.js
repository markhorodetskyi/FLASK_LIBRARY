var a = [];
var b = [];
var c = [];
var temp = [];
var maxCurrent = 36;
var maxVoltage = 230;
var minCurrent = 0;
var minVoltage = 170;
var options = {
  chart: {
    height: '100%',
    type: "line",
    stacked: false,
    redrawOnParentResize: true
  },
  dataLabels: {
    enabled: false
  },
  colors: ["#ffb200", "#177d00", "#b10303"],
  series: [
    {
      name: "А",
      data: a
    },
    {
      name: "B",
      data: b
    },
    {
      name: "C",
      data: c
    }
  ],
  stroke: {
    width: [1, 1],
    curve: 'smooth',
  },
  plotOptions: {
    bar: {
      columnWidth: "50%"
    }
  },
  xaxis: {
    categories: [],
    hideOverlappingLabels: true,
  },
  yaxis: [
    {
        forceNiceScale: true,
        axisTicks: {
        show: false
      },
      axisBorder: {
        show: true,
        color: "#FF1654"
      },
      labels: {
        style: {
          colors: "#FF1654"
        }
      },
      title: {
        text: "Струм",
        style: {
          color: "#FF1654"
        }
      }
    },
  ],
  tooltip: {
    shared: false,
    intersect: false,
    x: {
      show: false
    }
  },
  legend: {
    horizontalAlign: "left",
    offsetX: 40
  }
};
var chart = new ApexCharts(document.getElementById("chart"), options);

chart.render();


// function getData(){
//   $.ajax({
//     type: 'GET',
//     async: true,
//     url: stationId +'/getData',
//     success: function(data) {
//       console.log(data)
//       if(data['status'] != null) {
//         if (data['status'] == 'Available') {
//           document.getElementById("status").innerHTML = "<i class=\"fa fa-automobile text-c-green\"></i> Доступна";
//         } else if (data['status'] == 'Charging') {
//           document.getElementById("status").innerHTML = "<i class=\"fa fa-automobile text-c-blue\"></i> Йде підзарядка";
//           if(data['trnsId'] != null){
//             console.log(data['trnsId'])
//             getForChart(data['trnsId'])
//           }
//         } else if (data['status'] == 'Preparing') {
//           document.getElementById("status").innerHTML = "<i class=\"fa fa-automobile text-c-purple\"></i> Готується до заряджання";
//         } else if (data['status'] == null) {
//           document.getElementById("status").innerHTML = "<i class=\"fa fa-automobile text-c-purple\"></i> Невідомо";
//         }
//
//         if (data['current'] != null) {
//           document.getElementById("current").innerHTML = data['current'] + ' A';
//         }else{
//           document.getElementById("current").innerHTML = '0 A';
//         }
//         if (data['voltage1'] != null) {
//           document.getElementById("voltage").innerHTML = data['voltage1'] + ' V';
//         }else{
//           document.getElementById("voltage").innerHTML = '0 V';
//         }
//         if (data['wh'] != null) {
//           document.getElementById("kWh").innerHTML = data['wh'] + ' kWh';
//           document.getElementById("Wh").innerHTML = data['wh'] + ' kWh';
//         }else{
//           document.getElementById("kWh").innerHTML = '0 kWh';
//           document.getElementById("Wh").innerHTML = '0 kWh';
//         }
//         if (data['temp'] != null) {
//           document.getElementById("temp").innerHTML = data['temp'] + ' ℃';
//         }else{
//           document.getElementById("temp").innerHTML = '0 ℃';
//         }
//         document.getElementById("maxA").innerHTML = data['pilotAmp'] + 'A';
//       }
//     },
//     dataType: 'json',
//   });
// }

function getForChart(){
  $.ajax({
    type: 'GET',
    async: true,
    url: 'monitoring',
    success: function(data) {
      console.log(data)
      current = data['current'];
      voltage = data['voltage'];
      time = data['time']
      chart.updateOptions({
        xaxis: {
          categories: time
        },
      })
      chart.updateSeries([
        {
          name: "A",
          data: a
        },
        {
          name: "B",
          data: b
        },
        {
          name: "C",
          data: c
        },
      ]);
    },
    dataType: 'json',
  });
}

document.addEventListener('DOMContentLoaded', function() {
  changeChart()
  setInterval(changeChart, 60000)
}, false);

function changeChart(){
  $.ajax({
    type: 'GET',
    async: true,
    url: window.location.href+'monitoring',
    success: function(data) {
      console.log(data)
      a = data['pa'];
      b = data['pb'];
      c = data['pc'];
      time = data['time']
      chart.updateOptions({
        xaxis: {
          categories: time
        },
      })
      chart.updateSeries([
        {
          name: "A",
          data: a
        },
        {
          name: "B",
          data: b
        },
        {
          name: "C",
          data: c
        },
      ]);
    },
    dataType: 'json',
  });
}

function showStation(station){
  location.href = "/home/station/"+station;
}
