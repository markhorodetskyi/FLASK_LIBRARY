'use strict'; //це установка, яка змушує код оброблятися в строгому режимі . Без цієї установки код обробляється в необмеженому режимі. У строгому режимі:
    // деякі помилки можна знайти швидше,
    //більш небезпечні і не корисні риси JavaScript або заборонені, або призводять до помилки.

var clientID;
var host = 'mqtt.altenergotech.net'; // Без коментарів
var port = '8883'; // Без коментарів
var topic = 'testRead';
var client = null;

var devID=1;                    // Має передаватися ззовні
var timers = {'idWaitforAnswersTimer':null, 'idSaveWaitTimer ': null, 'idTimeInitTimer': null, 'idTimeUpdateTimer': null};

var mqttConnected = false;      // !!! Цієї змінної можна позбутися, якщо перевіряти безпосередньо змінну client
var bufferMqttAnswers = [];     // Масив отриманих по MQTT повідомлень (наповнюється в методі onMessageArrived)
var bufferMqqtRequests = [];    // Масив реально відправлених по MQTT повідомлень (наповнюється в методі sendSomething)
// Масиви bufferMqttAnswers та bufferMqqtRequests, зпустошуються після обробки в методі waitForAnswer)
var htmlObjects ={};            // Словник активних елементів сторінки налаштувань

var fiders={};

$(document).ready(function() {
// --------------------------------------------------------------Початок організації холста ----------------------------------------------

    paper.install(window);
    paper.setup(document.getElementById('mainCanvas'));
    var canvas = document.getElementById('mainCanvas');

    var toolPan = new paper.Tool();
    toolPan.activate();

    toolPan.onMouseDrag = function (event) {
      var delta = event.downPoint.subtract(event.point);
      var delta2 = new Point(delta.x, 0);
      paper.view.scrollBy(delta2)
    };


    var canWidth = canvas.width;
    canvas.height = (canWidth/1.7777777778)/100*85;
    var canHeight = canvas.height;
    var onePersentY = canHeight/100;
    var onePersentX = canWidth/100;
    var onePersentXY = (onePersentY + onePersentX)/2;



    var sections = Object.keys(parameters); //Витягуємо інформацію про фідера

    // ------------------------------ Створюємо фідера як об'єкти ------------------------------------
    for (let section in sections) {
        for (let fider in parameters[sections[section]]) {
            fiders[fider] = {
                // ------------------------------ Тіло фідера ------------------------------
                name: parameters[sections[section]][fider]['fiderName'],
                type: parameters[sections[section]][fider]['fiderType'],
                section: sections[section],
                position: parameters[sections[section]][fider]['fiderPosition'],
                fiderZeroPoint: parameters[sections[section]][fider]['fiderZeroPoint'],
                fiderBusSize: parameters[sections[section]][fider]['fiderBusSize'],
                knifeSwitchBus: parameters[sections[section]][fider]['knifeSwitchBus'],
                knifeSwitchBusEarth: parameters[sections[section]][fider]['knifeSwitchBusEarth'],
                knifeSwitchLine: parameters[sections[section]][fider]['knifeSwitchLine'],
                knifeSwitchLineEarth: parameters[sections[section]][fider]['knifeSwitchLineEarth'],
                switchModel: parameters[sections[section]][fider]['switchModel'],
                switchComment: parameters[sections[section]][fider]['switchComment'],
                StatusVD: {
                    '1': {
                        status: 0,
                        vd: null
                    },
                    '2': {
                        status: 0,
                        vd: null
                    },
                    '3': {
                        status: 0,
                        vd: null
                    },
                    '4': {
                        status: 0,
                        vd: null
                    },
                    '5': {
                        status: 0,
                        vd: null
                    },
                    '6': {
                        status: 0,
                        vd: null
                    },
                    '7': {
                        status: 0,
                        vd: null
                    },
                    '8': {
                        status: 0,
                        vd: null
                    },
                },
                vv: {
                    status: 0,
                    textVV: null,
                    vv: null,
                },
                current: {
                    NowIaValue: {
                        status: 0.0,
                        textCurrent: null,
                    },
                    NowIbValue: {
                        status: 0.0,
                        textCurrent: null,
                    },
                    NowIcValue: {
                        status: 0.0,
                        textCurrent: null,
                    },
                },
                protection: {
                    'MSZ1_Use': {
                        name: 'МСЗ-1',
                        status: 0,
                        textProtection: null,
                        Iwork: 0,
                        Twork: 0,
                    },
                    'MSZ2_Use': {
                        name: 'МСЗ-2',
                        status: 0,
                        textProtection: null,
                        Iwork: 0,
                        Twork: 0,
                    },
                    'SV1_Use': {
                        name: 'СВ-1',
                        status: 0,
                        textProtection: null,
                        Iwork: 0,
                        Twork: 0,
                    },
                    'SV2_Use': {
                        name: 'СВ-2',
                        status: 0,
                        textProtection: null,
                        Iwork: 0,
                        Twork: 0,
                    },
                    'ZNZ1_Use': {
                        name: 'ЗНЗ-1',
                        status: 0,
                        textProtection: null,
                        ZNZ1_UseLaunchOn3I0: {
                            Iwork: 0,
                            Twork: 0,
                        },
                        ZNZ1_UseLaunchOn3U0: {
                            Uwork: 0,
                        },
                    },
                    'ZNZ2_Use': {
                        name: 'ЗНЗ-2',
                        status: 0,
                        textProtection: null,
                        ZNZ2_UseLaunchOn3I0: {
                            Iwork: 0,
                            Twork: 0,
                        },
                        ZNZ2_UseLaunchOn3U0: {
                            Uwork: 0,
                        },
                    },
                    'ACHR_Use': {
                        name: 'АЧР',
                        status: 0,
                        textProtection: null,
                    },
                    'ZZ_Use': {
                        name: 'ЗЗ',
                        status: 0,
                        textProtection: null,
                        Twork: 0,
                    },
                    'APV_UseMode': {
                        status: 0,
                        MSZ1_UseAPV: 0,
                        MSZ2_UseAPV: 0,
                        SV1_UseAPV: 0,
                        SV2_UseAPV: 0,
                        ZNZ1_UseAPV: 0,
                        ZNZ2_UseAPV: 0,
                        APV_UseCHAPV: 0,
                        VZ_UseAPV: 0,
                    },
                },
                buttons: {
                    kvit: null,
                    parameters: null,
                    remotecontrol: null
                },
                buffer: {
                    sendCommand: [],
                    notAnswered: [],
                },
                    devId: parameters[sections[section]][fider]['fiderDevId'],
                    // -------------------------------------------------------------------------

                    // ----------------------------- Функції фідера ----------------------------

                    // ----------------------------- Основне креслення ----------------------------
                    draw() {

                        var busSegment = this.fiderBusSize * onePersentX;  //Визначаємо ширину сегменту для фідера у пікселях відносно 25% монітору
                        var zeroXY = new Point((busSegment * fider) - busSegment, 0); //Визначаємо нульову точку сегмента на холсті
                        var centerOfBusSection = zeroXY.x + busSegment / 2 - ((zeroXY.x + busSegment / 2) % 1) + 0.5; //Визначаємо середину сегмента вісь: Х, та нульову точку вісь: Y

                        //----------------------------------Шина------------------------------------
                        let BusSize = new Size(busSegment, onePersentXY * 0.50505); //Розміри шини
                        if (this.position == 'beginning') { // Визначаємо зміщення шини в залежності від того, чи фідер на початку або в кінці
                            var busStartPoint = new Point((busSegment * fider) - busSegment + onePersentX * 2, onePersentY * 5.86855);
                        } else if (this.position == 'end') {
                            var busStartPoint = new Point((busSegment * fider) - busSegment - onePersentX * 2, onePersentY * 5.86855);
                        } else {
                            var busStartPoint = new Point((busSegment * fider) - busSegment, onePersentY * 5.86855);
                        }
                        let rectangle = new Rectangle(busStartPoint, BusSize);
                        let bus = new Path.Rectangle(rectangle);
                        bus.fillColor = 'black';
                        //----------------------------------Шина------------------------------------


                        //----------------------------------Фідер------------------------------------
                        var pointOne = new Path.Circle({
                            center: [centerOfBusSection, onePersentY * 5.86855 + (onePersentXY * 0.50505) / 2],
                            radius: onePersentXY * 0.4329,
                            strokeColor: 'black',
                            fillColor: 'black'
                        });
                        let pointTwo = new Path.Circle({
                            center: [centerOfBusSection, onePersentY * 20],
                            radius: onePersentXY * 0.4329,
                            strokeColor: 'black',
                            fillColor: 'black'
                        });

                        let pathDataDash = 'M ' + (centerOfBusSection + onePersentX * 0.52083 + centerOfBusSection) / 2 + ' ' + (onePersentY * 10 + onePersentY * 15) / 2 +
                            'H ' + ((centerOfBusSection + onePersentX * 0.52083 + centerOfBusSection) / 2 + onePersentX * 3.1698) + 'V ' + ((onePersentY * 20) * 2 - onePersentY * 1.17371) / 2;

                        let pathData = 'M' + centerOfBusSection + ' ' + (onePersentY * 5.86855 + onePersentXY * 0.50505) + ' V ' + ' ' + onePersentY * 10 + ' ' +
                            ' M ' + (centerOfBusSection + onePersentX * 0.52083) + ' ' + onePersentY * 10 + 'L ' + centerOfBusSection + ' ' + onePersentY * 15 +
                            ' V ' + onePersentY * 30 +

                            ' M ' + centerOfBusSection + ' ' + onePersentY * 20 + ' H ' + (centerOfBusSection + onePersentX * 2.08332) +
                            ' M ' + (centerOfBusSection + onePersentX * 2.08332) + ' ' + ((onePersentY * 20) - onePersentY * 1.17371) + ' L ' + (centerOfBusSection + onePersentX * 4.16664) + ' ' + onePersentY * 20 +
                            ' H ' + (centerOfBusSection + onePersentX * 5.72913) + ' V ' + (onePersentY * 23) + ' M ' + (centerOfBusSection + onePersentX * 4.68747) + ' ' + (onePersentY * 23) +
                            ' H ' + (centerOfBusSection + onePersentX * 6.77079) + ' M ' + (centerOfBusSection + onePersentX * 4.947885) + ' ' + (onePersentY * 23.50) +
                            ' H ' + (centerOfBusSection + onePersentX * 6.510375) + ' M ' + (centerOfBusSection + onePersentX * 5.2083) + ' ' + (onePersentY * 24.00) +
                            ' H ' + (centerOfBusSection + onePersentX * 6.3396) + ' M ' + (centerOfBusSection + onePersentX * 5.468715) + ' ' + (onePersentY * 24.50) +
                            ' H ' + (centerOfBusSection + onePersentX * 5.989545);
                        if (this.type == 'intersection' && this.devId == null) {
                            pathData = pathData + 'M ' + centerOfBusSection + ' ' + onePersentY * 30 + 'V ' + onePersentY * 50;
                        }
                        if (this.type == 'intersection' && this.devId != null) {
                            pathData = pathData + 'M ' + centerOfBusSection + ' ' + onePersentY * 50 + 'H ' + (centerOfBusSection - busSegment);
                        }
                        if (this.devId) {
                            let tsCircle1 = new Path.Circle({
                                center: [centerOfBusSection - onePersentX * 1.56249, onePersentY * 48],
                                radius: onePersentXY * 0.4329,
                                strokeColor: 'black',
                            });
                            let tsCircle2 = new Path.Circle({
                                center: [centerOfBusSection + onePersentX * 1.56249, onePersentY * 48],
                                radius: onePersentXY * 0.4329,
                                strokeColor: 'black',
                            });
                            //-v-v-v-v-v-v-v-v-v-v-v-v-v-v-v-v-v-v-v-v-v-Текст-v-v-v-v-v-v-v-v-v-v-v-v-v-v-v-v-v-v-v-v-v-
                            let fiderName = new PointText({
                                point: [centerOfBusSection - busSegment / 4, onePersentY * 5.5],
                                content: this.name,
                                fillColor: 'black',
                                fontFamily: 'Courier New',
                                fontWeight: 'bold',
                                fontSize: onePersentXY * 0.8,
                                justification: 'center',
                            });

                            let fiderNumber = new PointText({
                                point: [centerOfBusSection, onePersentY * 5.4],
                                content: fider,
                                fillColor: 'black',
                                fontFamily: 'Courier New',
                                fontWeight: 'bold',
                                fontSize: onePersentXY * 0.8,
                                justification: 'center',
                            });

                            let knifeSwitchBusText = new PointText({
                                point: [centerOfBusSection - ((onePersentXY * 1) / 1.8) * this.knifeSwitchLine.length, onePersentY * 12.5],
                                content: this.knifeSwitchBus,
                                fillColor: 'black',
                                fontFamily: 'Courier New',
                                fontWeight: 'bold',
                                fontSize: onePersentXY * 0.8
                            });
                            let knifeSwitchBusEarthText = new PointText({
                                point: [centerOfBusSection + onePersentX * 1, onePersentY * 21],
                                content: this.knifeSwitchBusEarth,
                                fillColor: 'black',
                                fontFamily: 'Courier New',
                                fontWeight: 'bold',
                                fontSize: onePersentXY * 0.8
                            });

                            this.current.NowIaValue.textCurrent = new PointText({
                                point: [centerOfBusSection + (onePersentXY * 4.329) / 2, onePersentY * 31 + onePersentXY * 4.329],
                                content: 'Ia: ~' + this.current.NowIaValue.status + 'A',
                                fillColor: 'black',
                                fontFamily: 'Courier New',
                                fontWeight: 'bold',
                                fontSize: onePersentXY * 0.8
                            });
                            this.current.NowIbValue.textCurrent = new PointText({
                                point: [centerOfBusSection + (onePersentXY * 4.329) / 2, onePersentY * 32 + onePersentXY * 4.329],
                                content: 'Ib: ~' + this.current.NowIbValue.status + 'A',
                                fillColor: 'black',
                                fontFamily: 'Courier New',
                                fontWeight: 'bold',
                                fontSize: onePersentXY * 0.8
                            });
                            this.current.NowIcValue.textCurrent = new PointText({
                                point: [centerOfBusSection + (onePersentXY * 4.329) / 2, onePersentY * 33 + onePersentXY * 4.329],
                                content: 'Ic: ~' + this.current.NowIcValue.status + 'A',
                                fillColor: 'black',
                                fontFamily: 'Courier New',
                                fontWeight: 'bold',
                                fontSize: onePersentXY * 0.8
                            });
                            //-^-^-^-^-^-^-^-^-^-^-^-^-^-^-^-^-^-^-^-^-^-Текст-^-^-^-^-^-^-^-^-^-^-^-^-^-^-^-^-^-^-^-^-^-

                            let tsLine = 'M ' + ((centerOfBusSection - onePersentX * 1.56249) + (onePersentXY * 0.4329) * 0.707) + ' ' + (onePersentY * 48 - (onePersentXY * 0.4329) * 0.707) +
                                'H ' + (((centerOfBusSection - onePersentX * 1.56249) + (onePersentXY * 0.4329) * 0.707) + (onePersentXY * 0.4329)) + 'M ' + ((centerOfBusSection - onePersentX * 1.56249) + (onePersentXY * 0.4329) * 0.707) + ' ' + (onePersentY * 48 + (onePersentXY * 0.4329) * 0.707) +
                                'H ' + (((centerOfBusSection - onePersentX * 1.56249) + (onePersentXY * 0.4329) * 0.707) + (onePersentXY * 0.4329)) + 'M ' + ((centerOfBusSection + onePersentX * 1.56249) + (onePersentXY * 0.4329) * 0.707) + ' ' + (onePersentY * 48 - (onePersentXY * 0.4329) * 0.707) +
                                'H ' + (((centerOfBusSection + onePersentX * 1.56249) + (onePersentXY * 0.4329) * 0.707) + (onePersentXY * 0.4329)) + 'M ' + ((centerOfBusSection + onePersentX * 1.56249) + (onePersentXY * 0.4329) * 0.707) + ' ' + (onePersentY * 48 + (onePersentXY * 0.4329) * 0.707) +
                                'H ' + (((centerOfBusSection + onePersentX * 1.56249) + (onePersentXY * 0.4329) * 0.707) + (onePersentXY * 0.4329));
                            let shemetsLine = new PathItem.create(tsLine);
                            shemetsLine.strokeColor = 'black';
                            shemetsLine.strokeWidth = 1;


                            pathData = pathData + 'M ' + centerOfBusSection + ' ' + (onePersentY * 30 + onePersentXY * 4.329) + 'V ' + onePersentY * 50;
                            let switchSize = new Size(onePersentXY * 4.329, onePersentXY * 4.329);
                            let switchPoint = new Point(centerOfBusSection - (onePersentXY * 4.329) / 2, onePersentY * 30);
                            let switchRec = new Rectangle(switchPoint, switchSize);
                            this.vv.vv = new Path.Rectangle(switchRec);
                            this.vv.vv.strokeColor = 'black';
                            this.vv.textVV = new PointText({
                                point: [centerOfBusSection - onePersentX * 0.624996, onePersentY * 30 + (onePersentXY * 4.329) / 2 + onePersentY * 0.4107985],
                                content: '',
                                fillColor: 'black',
                                fontFamily: 'Courier New',
                                fontWeight: 'bold',
                                fontSize: onePersentXY * 1.08225
                            });
                            let switchName = new PointText({
                                point: [centerOfBusSection + onePersentX * 1.7, onePersentY * 30 + (onePersentXY * 4.329) / 2 + onePersentY * 0.4107985],
                                content: this.switchModel,
                                fillColor: 'black',
                                fontFamily: 'Courier New',
                                fontWeight: 'bold',
                                fontSize: onePersentXY * 0.8
                            });


                            let pointSpace = 15;
                            let vdDiametr = onePersentXY * 0.3;
                            for (let wdIndcr in this.StatusVD) {
                                let textVD = new PointText({
                                    point: null,
                                    content: 'VD-' + wdIndcr,
                                    fillColor: 'black',
                                    fontFamily: 'Courier New',
                                    fontWeight: 'bold',
                                    fontSize: onePersentXY * 0.7
                                });
                                if (wdIndcr == '1') {
                                    textVD.point = [centerOfBusSection - busSegment / 4 - textVD.fontSize / 1.1 * textVD.content.length, onePersentY * 8 + vdDiametr / 2];
                                    this.StatusVD[wdIndcr].vd = new Path.Circle(new Point(centerOfBusSection - busSegment / 4, onePersentY * 8), vdDiametr);
                                } else if (wdIndcr == '5') {
                                    textVD.point = [centerOfBusSection + busSegment / 4 - textVD.fontSize / 1.1 * textVD.content.length, onePersentY * 8 + vdDiametr / 2];
                                    this.StatusVD[wdIndcr].vd = new Path.Circle(new Point(centerOfBusSection + busSegment / 4, onePersentY * 8), vdDiametr);
                                } else if (wdIndcr > '5') {
                                    textVD.point = [centerOfBusSection + busSegment / 4 - textVD.fontSize / 1.1 * textVD.content.length, onePersentY * 8 + pointSpace * (parseInt(wdIndcr) - 5) + vdDiametr / 2];
                                    this.StatusVD[wdIndcr].vd = new Path.Circle(new Point(centerOfBusSection + busSegment / 4, onePersentY * 8 + pointSpace * (parseInt(wdIndcr) - 5)), vdDiametr);
                                } else {
                                    textVD.point = [centerOfBusSection - busSegment / 4 - textVD.fontSize / 1.1 * textVD.content.length, onePersentY * 8 + pointSpace * (parseInt(wdIndcr) - 1) + vdDiametr / 2];
                                    this.StatusVD[wdIndcr].vd = new Path.Circle(new Point(centerOfBusSection - busSegment / 4, onePersentY * 8 + pointSpace * (parseInt(wdIndcr) - 1)), vdDiametr);
                                }
                                this.StatusVD[wdIndcr].vd.fillColor = '#C0C0C0';
                            }


                            //---------------------------------------------кнопка-------------------------------------------------------------------
                            let buttonSize = new Size(onePersentX * 7.81245, onePersentY * 4.2);
                            let buttonPoint = new Point(centerOfBusSection + (busSegment / 2 - onePersentX * 7.81245) / 2, onePersentY * 70);
                            // let buttonPoint = new Point(100, 100);
                            let rect = new Rectangle(buttonPoint, buttonSize);
                            this.buttons.kvit = new Path.Rectangle(rect, 6);

                            this.buttons.kvit.fillColor = '#dedede';
                            this.buttons.kvit.onClick = function () {
                                $("#ex1").modal({
                                    modalClass: "modal",
                                    escapeClose: false,
                                    clickClose: false,
                                    showClose: false,
                                    fadeDuration: 1000,
                                    fadeDelay: 0.50
                                });
                            };
                            //_____________________________________________________________________________________________________________________

                        }
                        if (this.type != 'intersection' && this.devId != null) {
                            let pointThree = new Path.Circle({
                                center: [centerOfBusSection, onePersentY * 60],
                                radius: onePersentXY * 0.4329,
                                strokeColor: 'black',
                                fillColor: 'black'
                            });
                            let knifeSwitchLineText = new PointText({
                                point: [centerOfBusSection - ((onePersentXY * 1) / 1.8) * this.knifeSwitchLine.length, onePersentY * 52.5],
                                content: this.knifeSwitchLine,
                                fillColor: 'black',
                                fontFamily: 'Courier New',
                                fontWeight: 'bold',
                                fontSize: onePersentXY * 0.8
                            });
                            let knifeSwitchLineEarthText = new PointText({
                                point: [centerOfBusSection + onePersentX * 1, onePersentY * 61],
                                content: this.knifeSwitchLineEarth,
                                fillColor: 'black',
                                fontFamily: 'Courier New',
                                fontWeight: 'bold',
                                fontSize: onePersentXY * 0.8
                            });

                            pathDataDash = pathDataDash + 'M ' + (centerOfBusSection + onePersentX * 0.52083 + centerOfBusSection) / 2 + ' ' + (onePersentY * 50 + onePersentY * 55) / 2 +
                                'H ' + ((centerOfBusSection + onePersentX * 0.52083 + centerOfBusSection) / 2 + onePersentX * 3.1698) +
                                'V ' + ((onePersentY * 60) * 2 - onePersentY * 1.17371) / 2;

                            pathData = pathData + 'M ' + (centerOfBusSection + onePersentX * 0.52083) + ' ' + onePersentY * 50 +
                                'L ' + centerOfBusSection + ' ' + onePersentY * 55 + 'V ' + onePersentY * 65 +
                                'M ' + centerOfBusSection + ' ' + (onePersentY * 65 + onePersentY * 3.52113) + 'L ' + (centerOfBusSection - onePersentX * 1.04166) + ' ' + onePersentY * 65 +
                                'H ' + (centerOfBusSection + onePersentX * 1.04166) + 'L ' + centerOfBusSection + ' ' + (onePersentY * 65 + onePersentY * 3.52113) +
                                'V ' + onePersentY * 75 +

                                'M ' + centerOfBusSection + ' ' + onePersentY * 60 + 'H ' + (centerOfBusSection + onePersentX * 2.08332) +
                                'M ' + (centerOfBusSection + onePersentX * 2.08332) + ' ' + ((onePersentY * 60) - onePersentY * 1.17371) + 'L ' + (centerOfBusSection + onePersentX * 4.16664) + ' ' + onePersentY * 60 +
                                'H ' + (centerOfBusSection + onePersentX * 5.72913) + 'V ' + (onePersentY * 63) + 'M ' + (centerOfBusSection + onePersentX * 4.68747) + ' ' + (onePersentY * 63) +
                                'H ' + (centerOfBusSection + onePersentX * 6.77079) + 'M ' + (centerOfBusSection + onePersentX * 4.947885) + ' ' + (onePersentY * 63.50) +
                                'H ' + (centerOfBusSection + onePersentX * 6.510375) + 'M ' + (centerOfBusSection + onePersentX * 5.208) + ' ' + (onePersentY * 64.00) +
                                'H ' + (centerOfBusSection + onePersentX * 6.3396) + 'M ' + (centerOfBusSection + onePersentX * 5.468715) + ' ' + (onePersentY * 64.50) +
                                'H ' + (centerOfBusSection + onePersentX * 5.989545);
                        }

                        let shemeLine = new PathItem.create(pathData);
                        shemeLine.strokeColor = 'black';
                        shemeLine.strokeWidth = 1;

                        let shemeLineDash = new PathItem.create(pathDataDash);
                        shemeLineDash.strokeColor = 'black';
                        shemeLineDash.strokeCap = 'round';
                        shemeLineDash.strokeWidth = 0.5;
                        shemeLineDash.dashArray = [5, 5];

                        let startBorder = new Point(busSegment * fider, 20);
                        let endBorder = new Point(busSegment * fider, canHeight);
                        let borderLine = new Path.Line(startBorder, endBorder);
                        borderLine.strokeColor = '#808080';
                        borderLine.strokeCap = 'round';
                        borderLine.strokeWidth = 0.5;
                        borderLine.dashArray = [7, 8];

                    },
                    showCurrent(){
                        for (let current in this.current){
                            if(current == 'NowIaValue'){
                                this.current[current].textCurrent.content = 'Ia: ~' + (this.current[current].status*40).toFixed(2) + ' A'
                            }else if (current == 'NowIbValue'){
                                this.current[current].textCurrent.content = 'Ib: ~' + (this.current[current].status*40).toFixed(2) + ' A'
                            }else if (current == 'NowIcValue') {
                                this.current[current].textCurrent.content = 'Ic: ~' + (this.current[current].status*40).toFixed(2) + ' A'
                            }
                        }
                    },

                    showWD() {
                        for (let wdIndcr in this.StatusVD) {
                            if (this.StatusVD[wdIndcr].status == 0) {
                                this.StatusVD[wdIndcr].vd.fillColor = '#dedede';
                            } else {
                                this.StatusVD[wdIndcr].vd.fillColor = '#32CD32';
                            }
                        }

                    },
                    showProtection() {
                        let meter = 1;
                        var busSegment = this.fiderBusSize * onePersentX;  //Визначаємо ширину сегменту для фідера у пікселях відносно 20% монітору
                        var zeroXY = new Point((busSegment * fider) - busSegment, 0); //Визначаємо нульову точку сегмента на холсті
                        for (let protections in this.protection) {
                            if (this.protection[protections].textProtection) {
                                this.protection[protections].textProtection.content = '';
                            }
                            if (this.protection[protections].status != 0 && protections != 'APV_UseMode') {
                                this.protection[protections].textProtection = new PointText({
                                    point: [(zeroXY.x + onePersentX * 2.5), onePersentY * (24 + meter)],
                                    content: this.protection[protections].name + ' I:' + this.protection[protections].Iwork + ' T:' + this.protection[protections].Twork,
                                    fillColor: 'black',
                                    fontFamily: 'Courier New',
                                    fontWeight: 'bold',
                                    fontSize: onePersentXY * 0.8
                                });
                                meter += 3;
                            } else {
                                this.protection[protections].textProtection = null;
                            }
                        }
                        meter = 1;
                    },
                    showVV() {
                        if (this.vv.status == 0) {
                            this.vv.vv.fillColor = '#FFFFFF';
                            this.vv.textVV.content = 'OFF';
                            //this.vv.textVV.point = [centerOfBusSection-onePersentX*0.624996, onePersentY * 30 + (onePersentXY*4.329)/2 + onePersentY*3.9319285 ];
                        } else {
                            this.vv.vv.fillColor = '#000000';
                            this.vv.textVV.content = 'ON';
                            this.vv.textVV.point = [centerOfBusSection - onePersentX * 0.624996, onePersentY * 30 + (onePersentXY * 4.329) / 2 + onePersentY * 3.9319285];
                        }
                    },
                    updateBuffer(){

                    },
                }
            }
        }
        console.log(fiders);
        for (let fider in fiders) {
            fiders[fider].draw();
        }

        function updateWD() {
            for (let fider in fiders) {
                if (fiders[fider]['devId']){
                    fiders[fider].showCurrent();
                    fiders[fider].showWD();
                    fiders[fider].showVV();
                    fiders[fider].showProtection();
                }
            }
        }

        setInterval(updateWD, 10000);
        paper.view.draw();
// --------------------------------------------------------------Кінець організації холста ----------------------------------------------

        // let commands = {};
        // for (let command in modbusmap) {
        //     commands[command] = {
        //         address: modbusmap[command]['address'],
        //         block: modbusmap[command]['block'],
        //         format: modbusmap[command]['format'],
        //         len: modbusmap[command]['len'],
        //         access: modbusmap[command]['access'],
        //         min: modbusmap[command]['min'],
        //         max: modbusmap[command]['max'],
        //         step: modbusmap[command]['step'],
        //         reverse: modbusmap[command]['inverse'],
        //
        //     };
        // }

        // MSZ1_Use - ознака аикористання МСЗ-1. Якщо вона 1 - то тоді ще підчитати (MSZ1_Iwork - струм спрацювання та MSZ1_Twork - час затримки)
        // MSZ2_Use - ознака аикористання МСЗ-2. Якщо вона 1 - то тоді ще підчитати (MSZ2_Iwork - струм спрацювання та MSZ2_Twork- час затримки)
        // SV1_Use - ознака аикористання СВ-1. Якщо вона 1 - то тоді ще підчитати (SV1_Iwork - струм спрацювання та SV1_Twork - час затримки)
        // SV2_Use - ознака аикористання СВ-2. Якщо вона 1 - то тоді ще підчитати (SV2_Iwork - струм спрацювання та SV2_Twork - час затримки)
        // ЗНЗ складніше
        // ZNZ1_Use - ознака аикористання ЗНЗ-1. Якщо вона 1 - то тоді ще підчитати (ZNZ1_UseLaunchOn3I0 - ознака спрацювання по струму, якщо вона 1 - то підчитати (ZNZ1_Iwork - струм спрацювання та ZNZ1_Twork - час затримки), (ZNZ1_UseLaunchOn3U0 - якщо воно 1 - то підчитати (ZNZ1_Uwork - поріг спрацювання по напрузі)))
        //
        // ZNZ2_Use - ознака аикористання ЗНЗ-2. Якщо вона 1 - то тоді ще підчитати (ZNZ2_UseLaunchOn3I0 - ознака спрацювання по струму, якщо вона 1 - то підчитати (ZNZ2_Iwork - струм спрацювання та ZNZ2_Twork - час затримки), (ZNZ2_UseLaunchOn3U0 - якщо воно 1 - то підчитати (ZNZ2_Uwork - поріг спрацювання по напрузі)))
        // ACHR_Use - ознака аикористання АЧР. Параметрів не має
        // VZ_Use - ознака аикористання ЗЗ. Якщо вона 1 - то тоді ще підчитати (VZ_Twork - час затримки)
        // (до речі VZ_треба в карті замінити на ZZ_)
        //
        // APV_UseMode - режим використання АПВ. Якщо вона не 0 (1 або 2) - то тоді ще підчитати по всім захистам (MSZ1_UseAPV - ознака задіяння АПВ після МСЗ-1, MSZ2_UseAPV - ознака задіяння АПВ після МСЗ-2, SV1_UseAPV - ознака задіяння АПВ після СВ-1, SV2_UseAPV - ознака задіяння АПВ після СВ-2, ZNZ1_UseAPV - ознака задіяння АПВ після ЗНЗ-1, ZNZ2_UseAPV - ознака задіяння АПВ після ЗНЗ-2, APV_UseCHAPV - ознака задіяння ЧАПВ після зняття сигналу АЧР (хоча тут я не впевнений), VZ_UseAPV - ознака задіяння АПВ після ЗЗ.
        // І якось компактно розмістити ті захисти, де ці параметри 1





// ---------------------------------------------------------- Організація MQTT з'єднання -------------------------------------------

    console.log("Встановлення з'єднання  " + host + ' ' + port); // Контроль
    clientID = author;
    createMqttClient();
// ---------------------------------------------------------------------------------------------------------------------------------
    let settingsName = getElementEx('Готовний селектор налаштувань', 'settings_name');
    let settingsNum = getElementEx('Готовний селектор налаштувань', 'settings_num');
    let body = getElementEx('Готовний селектор налаштувань+','body');
    console.log(body)
    if ((settingsName === null) || (settingsNum === null)) {
        body.innerHTML('Сторінка сформована не коректно.<br>Продовжувати немає сенсу');
    }
    else {
        settingsName = settingsName.textContent;
        settingsNum = settingsNum.textContent;
        // Готуємо словник функцій з параметрами, якими необхідно наповнити масив htmlObjects
        const funcs = {'МСЗ': [settingsMSZprepate, settingsNum], 'СВ': [settingsSVprepate, settingsNum],
            'ЗНЗ': [settingsZNZprepate, settingsNum], 'АЧР': [settingsACHRprepate, 'ACHR'],
            'ЗЗ': [settingsZZprepate, 'ZZ'], 'АПВ': [settingsAPVprepate, 'APV'],
            'KL': [settingsKLprepate, settingsNum],'VD': [settingsVDprepate, settingsNum],
            'DI': [settingsDIprepate, settingsNum], 'ВВ':[settingsVVprepate, settingsNum],
            'журналу навантажень': [settingsMagazineLoadsprepate, settingsNum],
            'Осцилограф': [settingsOSCILOSCOPEprepate, settingsNum],
            'дати та часу': [settingsDATETIMEpeprepate, settingsNum],
            'Телуправління': [TUprepare, settingsNum], 'Налаштування пристрою':[mainPrepare, settingsNum]
        };
        if (settingsName in funcs) {
            funcs[settingsName][0] (funcs[settingsName][1]);
        }
        else {
            body.innerHTML = 'Сторінка сформована не коректно.<br>' +
                'Налаштування з назвою [' + settingsName + '] не передбачені в головному селекторі<br>' +
                'Продовжувати немає сенсу';
            }
    }
});