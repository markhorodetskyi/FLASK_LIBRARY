'use strict';
/* ===================================================================================================================*/
/*                                     Блок допоміжних функцій                                                        */
/* ===================================================================================================================*/
/*-------------------------------------------------------------------------------Mark function-----------------------------------------------------------------*/

function testModal() {
    $("#ex2").modal({
        modalClass: "modal",
        escapeClose: false,
        clickClose: false,
        showClose: false,
        fadeDuration: 1000,
        fadeDelay: 0.50
    });
}

function testModal2() {
    $("#ex1").modal({
        modalClass: "modal",
        escapeClose: false,
        clickClose: false,
        showClose: false,
        fadeDuration: 1000,
        fadeDelay: 0.50
    });
}

function parseMessage(message) {
    let separator = message.split('|');
    if(separator[0]){
       if (separator[2] == 'getMonitoring') {
            noteResponse.StatusVD(separator[3], separator[1]);
            noteResponse.StatusDI(separator[4], separator[1]);
            noteResponse.NowIaValue(separator[7], separator[1]);
            noteResponse.NowIbValue(separator[8], separator[1]);
            noteResponse.NowIcValue(separator[9], separator[1]);
            message = {
                status: separator[0],
                devId: parseInt(separator[1]),
                msgType: separator[2],
                command: null,
                answer: [separator[3], separator[7], separator[8], separator[9]]
            };
            console.log("getmonitoring: "+message);
        }else if(separator[2] == 'get'){
            message = {
                status: separator[0],
                devId: parseInt(separator[1]),
                msgType: separator[2],
                command: separator[3],
                answer: separator[4],
            };
            console.log("get: "+message);
        }
    }
    //----------------------Пошук повідомлення в буфері та зміна його статусу-----------------------------------
    for(let fider in fiders){
        if(fiders[fider].devId == message.devId){
            for(let buffMessage in fiders[fider].buffer.sendCommand){
                if(fiders[fider].buffer.sendCommand[buffMessage].command == message.command || fiders[fider].buffer.sendCommand[buffMessage].msgType == 'getMonitoring'){
                    fiders[fider].buffer.sendCommand[buffMessage].status = 1;
                }
            }
        }
    }
    //----------------------------------------------------------------------------------------------------------
    if (noteResponse[message.command]) {
        noteResponse[message.command](message.answer, message.devId);
    }
}

function updateWD() {
    for (let fider in fiders) {
        if (fiders[fider]['devId']){
            fiders[fider].showWD();
            fiders[fider].showVV();
            fiders[fider].showProtection();
        }
    }
}

function parseBuffer() {
    let timestamp = Date.now() / 1000 | 0;
    for(let fider in fiders){
        if(fiders[fider].devId != null){
            let counter = 0;
            let counterMessages = fiders[fider].buffer.sendCommand.length;
            for(let buffMessage in fiders[fider].buffer.sendCommand){
                if(fiders[fider].buffer.sendCommand[buffMessage].status == 0){
                    counter+=1;
                }
            }
            console.log(fider+' '+counterMessages);
            console.log(100/counterMessages*(counterMessages-counter));
        }
    }
}

function update() {
    let topic = 'testRead';
    for (let fider in fiders) {
        console.log(fider);
        if (fiders[fider].devId != null) {
            sendSomething(topic, null, null,{
                devId: fiders[fider].devId,
                msgType: 'getMonitoring',
                author: author,
            });
            // console.log("???????????????????????????????????????????????");
            //  console.log(topic, {
            //      devId: fiders[fider].devId,
            //      msgType: 'get',
            //      author: author,
            //      command: monitoringCommand[command],
            //  });
        }
    }
}
setInterval(update, 10000);
var noteResponse = {
    StatusVD(data, devId) {
        let reverse = data.split('').reverse().join('');
        for (let fider in fiders) {
            if (fiders[fider]['devId'] == devId) {
                for (let wd = 0; wd <= 7; wd++) {
                    fiders[fider]['StatusVD'][wd + 1]['status'] = reverse[wd];
                }
            }
        }
    },
    StatusDI(data, devId) {
        let reverse = data.split('').reverse().join('');
        for (let fider in fiders) {
            if (fiders[fider]['devId'] == devId) {
                for (let di = 0; di <= 3; di++) {
                    fiders[fider]['StatusDI'][di + 1]['status'] = reverse[di];
                }
            }
        }
    },
    StatusVV(data, devId) {
        for (let fider in fiders) {
            if (fiders[fider]['devId'] == devId) {
                for (let wd = 0; wd <= 7; wd++) {
                    console.log()               //Допрацювати<--------------------------------------------------------
                }
            }
        }
    },
    KvitEvent(data, devId) {
        for (let fider in fiders) {
            if (fiders[fider]['devId'] == devId) {
                console.log()               //Допрацювати<--------------------------------------------------------
            }
        }
    },
    NowIaValue(data, devId) {
        for (let fider in fiders) {
            if (fiders[fider]['devId'] == devId) {
                fiders[fider].current.NowIaValue.status = data;
            }
        }
    },
    NowIbValue(data, devId) {
        for (let fider in fiders) {
            if (fiders[fider]['devId'] == devId) {
                fiders[fider].current.NowIbValue.status = data;
            }
        }
    },
    NowIcValue(data, devId) {
        for (let fider in fiders) {
            if (fiders[fider]['devId'] == devId) {
                fiders[fider].current.NowIcValue.status = data;
            }
        }
    },

    // --------------------------------------------------------------

    MSZ1_Use(data, devId) {
        for (let fider in fiders) {
            if (fiders[fider]['devId'] == devId) {
                fiders[fider].protection.MSZ1_Use.status = data;
                if (fiders[fider].protection.MSZ1_Use.status == 1) {
                    let request = {devId: devId, msgType: 'get', author: author, command: 'MSZ1_Iwork'};
                    sendSomething(topic,null, null, request);
                        request = {devId: devId, msgType: 'get', author: author, command: 'MSZ1_Twork'};
                    sendSomething(topic,null, null, request);
                    // не забути забрати тимчасовий break з усіх функцій
                }
            }
        }
    },
    MSZ1_Iwork(data, devId) {
        for (let fider in fiders) {
            if (fiders[fider]['devId'] == devId) {
                fiders[fider].protection.MSZ1_Use.Iwork = data;
            }
        }
    },
    MSZ1_Twork(data, devId) {
        for (let fider in fiders) {
            if (fiders[fider]['devId'] == devId) {
                fiders[fider].protection.MSZ1_Use.Twork = data;
            }
        }
    },


    MSZ2_Use(data, devId) {
        for (let fider in fiders) {
            if (fiders[fider]['devId'] == devId) {
                fiders[fider].protection.MSZ2_Use.status = data;
                if (fiders[fider].protection.MSZ2_Use.status == 1) {
                    let request = {devId: devId, msgType: 'get', author: author, command: 'MSZ2_Iwork'};
                    sendSomething(topic,null, null, request);
                        request = {devId: devId, msgType: 'get', author: author, command: 'MSZ2_Twork'};
                    sendSomething(topic,null, null, request);
                }
            }
        }
    },
    MSZ2_Iwork(data, devId) {
        for (let fider in fiders) {
            if (fiders[fider]['devId'] == devId) {
                fiders[fider].protection.MSZ2_Use.Iwork = data;
            }
        }
    },
    MSZ2_Twork(data, devId) {
        for (let fider in fiders) {
            if (fiders[fider]['devId'] == devId) {
                fiders[fider].protection.MSZ2_Use.Twork = data;
            }
        }
    },

    // --------------------------------------------------------------

    SV1_Use(data, devId) {
        for (let fider in fiders) {
            if (fiders[fider]['devId'] == devId) {
                fiders[fider].protection.SV1_Use.status = data;
                if (fiders[fider].protection.SV1_Use.status == 1) {
                    let request = {devId: devId, msgType: 'get', author: author, command: 'SV1_Iwork'};
                    sendSomething(topic,null, null, request);
                    request = {devId: devId, msgType: 'get', author: author, command: 'SV1_Twork'};
                    sendSomething(topic,null, null, request);
                }
            }
        }
    },
    SV1_Iwork(data, devId) {
        for (let fider in fiders) {
            if (fiders[fider]['devId'] == devId) {
                fiders[fider].protection.SV1_Use.Iwork = data;
            }
        }
    },
    SV1_Twork(data, devId) {
        for (let fider in fiders) {
            if (fiders[fider]['devId'] == devId) {
                fiders[fider].protection.SV1_Use.Twork = data;
            }
        }
    },


    SV2_Use(data, devId) {
        for (let fider in fiders) {
            if (fiders[fider]['devId'] == devId) {
                fiders[fider].protection.SV2_Use.status = data;
                if (fiders[fider].protection.SV2_Use.status == 1) {
                    let request = {devId: devId, msgType: 'get', author: author, command: 'SV2_Iwork'};
                    sendSomething(topic,null, null, request);
                    request = {devId: devId, msgType: 'get', author: author, command: 'SV2_Twork'};
                    sendSomething(topic,null, null, request);
                }
            }
        }
    },
    SV2_Iwork(data, devId) {
        for (let fider in fiders) {
            if (fiders[fider]['devId'] == devId) {
                fiders[fider].protection.SV2_Use.Iwork = data;
            }
        }
    },
    SV2_Twork(data, devId) {
        for (let fider in fiders) {
            if (fiders[fider]['devId'] == devId) {
                fiders[fider].protection.SV2_Use.Twork = data;
            }
        }
    },

    // --------------------------------------------------------------

    ZNZ1_Use(data, devId) {
        for (let fider in fiders) {
            if (fiders[fider]['devId'] == devId) {
                fiders[fider].protection.ZNZ1_Use.status = data;
                if (fiders[fider].protection.ZNZ1_Use.status == 1) {
                    let request = {devId: devId, msgType: 'get', author: author, command: 'ZNZ1_Iwork'};
                    sendSomething(topic,null, null, request);
                    request = {devId: devId, msgType: 'get', author: author, command: 'ZNZ1_Twork'};
                    sendSomething(topic,null, null, request);
                }
            }
        }
    },
    ZNZ1_Iwork(data, devId) {
        for (let fider in fiders) {
            if (fiders[fider]['devId'] == devId) {
                fiders[fider].protection.ZNZ1_Use.Iwork = data;
            }
        }
    },
    ZNZ1_Twork(data, devId) {
        for (let fider in fiders) {
            if (fiders[fider]['devId'] == devId) {
                fiders[fider].protection.ZNZ1_Use.Twork = data;
            }
        }
    },


    ZNZ2_Use(data, devId) {
        for (let fider in fiders) {
            if (fiders[fider]['devId'] == devId) {
                fiders[fider].protection.ZNZ2_Use.status = data;
                if (fiders[fider].protection.ZNZ2_Use.status == 1) {
                    let request = {devId: devId, msgType: 'get', author: author, command: 'ZNZ2_Iwork'};
                    sendSomething(topic,null, null, request);
                    request = {devId: devId, msgType: 'get', author: author, command: 'ZNZ2_Twork'};
                    sendSomething(topic,null, null, request);
                }
            }
        }
    },
    ZNZ2_Iwork(data, devId) {
        for (let fider in fiders) {
            if (fiders[fider]['devId'] == devId) {
                fiders[fider].protection.ZNZ2_Use.Iwork = data;
            }
        }
    },
    ZNZ2_Twork(data, devId) {
        for (let fider in fiders) {
            if (fiders[fider]['devId'] == devId) {
                fiders[fider].protection.ZNZ2_Use.Twork = data;
            }
        }
    },
    // --------------------------------------------------------------

    ACHR_Use(data, devId) {
        for (let fider in fiders) {
            if (fiders[fider]['devId'] == devId) {
                fiders[fider].protection.ACHR_Use.status = data;
                if (fiders[fider].protection.ACHR_Use.status == 1) {
                    let request = {devId: devId, msgType: 'get', author: author, command: 'ACHR_Twork'};
                    sendSomething(topic,null, null, request);
                }
            }
        }
    },
    // --------------------------------------------------------------

    ZZ_Use(data, devId) {
        for (let fider in fiders) {
            if (fiders[fider]['devId'] == devId) {
                fiders[fider].protection.ZZ_Use.status = data;
                if (fiders[fider].protection.ZZ_Use.status == 1) {
                    let request = {devId: devId, msgType: 'get', author: author, command: 'ZZ_Twork'};
                    sendSomething(topic,null, null, request);
                }
            }
        }
    },
    ZZ_Twork(data, devId) {
        for (let fider in fiders) {
            if (fiders[fider]['devId'] == devId) {
                fiders[fider].protection.ZZ_Use.Twork = data;
            }
        }
    },

    // --------------------------------------------------------------

    APV_UseMode(data, devId) {
        for (let fider in fiders) {
            if (fiders[fider]['devId'] == devId) {
                fiders[fider].protection.APV_UseMode.status = data;
                if (fiders[fider].protection.APV_UseMode.status == 1 || fiders[fider].protection.APV_UseMode.status == 2) {
                    let MSZ1_UseAPV = {devId: devId, msgType: 'get', author: author, command: 'MSZ1_UseAPV'};
                    sendSomething(topic,null, null, MSZ1_UseAPV);
                    let MSZ2_UseAPV = {devId: devId, msgType: 'get', author: author, command: 'MSZ2_UseAPV'};
                    sendSomething(topic,null, null, MSZ2_UseAPV);
                    let SV1_UseAPV = {devId: devId, msgType: 'get', author: author, command: 'SV1_UseAPV'};
                    sendSomething(topic,null, null, SV1_UseAPV);
                    let SV2_UseAPV = {devId: devId, msgType: 'get', author: author, command: 'SV2_UseAPV'};
                    sendSomething(topic,null, null, SV2_UseAPV);
                    let ZNZ1_UseAPV = {devId: devId, msgType: 'get', author: author, command: 'ZNZ1_UseAPV'};
                    sendSomething(topic,null, null, ZNZ1_UseAPV);
                    let ZNZ2_UseAPV = {devId: devId, msgType: 'get', author: author, command: 'ZNZ2_UseAPV'};
                    sendSomething(topic,null, null, ZNZ2_UseAPV);
                    let APV_UseCHAPV = {
                        devId: devId,
                        msgType: 'get',
                        author: author,
                        command: 'APV_UseCHAPV'
                    };
                    sendSomething(topic,null, null, APV_UseCHAPV);
                    let ZZ_UseAPV = {devId: devId, msgType: 'get', author: author, command: 'ZZ_UseAPV'};
                    sendSomething(topic,null, null, ZZ_UseAPV);
                    break;

                }
            }
        }
    },
    MSZ1_UseAPV(data, devId) {
        for (let fider in fiders) {
            if (fiders[fider]['devId'] == devId) {
                fiders[fider].protection.APV_UseMode.MSZ1_UseAPV = data;
                break;
            }
        }
    },
    MSZ2_UseAPV(data, devId) {
        for (let fider in fiders) {
            if (fiders[fider]['devId'] == devId) {
                fiders[fider].protection.APV_UseMode.MSZ2_UseAPV = data;
                break;
            }
        }
    },
    SV1_UseAPV(data, devId) {
        for (let fider in fiders) {
            if (fiders[fider]['devId'] == devId) {
                fiders[fider].protection.APV_UseMode.SV1_UseAPV = data;
                break;
            }
        }
    },
    SV2_UseAPV(data, devId) {
        for (let fider in fiders) {
            if (fiders[fider]['devId'] == devId) {
                fiders[fider].protection.APV_UseMode.SV2_UseAPV = data;
                break;
            }
        }
    },
    ZNZ1_UseAPV(data, devId) {
        for (let fider in fiders) {
            if (fiders[fider]['devId'] == devId) {
                fiders[fider].protection.APV_UseMode.ZNZ1_UseAPV = data;
                break;
            }
        }
    },
    ZNZ2_UseAPV(data, devId) {
        for (let fider in fiders) {
            if (fiders[fider]['devId'] == devId) {
                fiders[fider].protection.APV_UseMode.ZNZ2_UseAPV = data;
                break;
            }
        }
    },
    APV_UseCHAPV(data, devId) {
        for (let fider in fiders) {
            if (fiders[fider]['devId'] == devId) {
                fiders[fider].protection.APV_UseMode.APV_UseCHAPV = data;
                break;
            }
        }
    },
    ZZ_UseAPV(data, devId) {
        for (let fider in fiders) {
            if (fiders[fider]['devId'] == devId) {
                fiders[fider].protection.APV_UseMode.ZZ_UseAPV = data;
                break;
            }
        }
    },

};
/*-------------------------------------------------------------------------------Mark function-----------------------------------------------------------------*/

function actionAfterClose(wait, count) {
    // console.log('inside subtimer');
    let bready = true;
    if (wait) {
        bready = (count === bufferMqqtRequests.length);
        // console.log('waiting, bready = '+ bready);
        if (bready) {
            clearInterval(timers['idSaveWaitTimer']);
            console.log('stop idSaveWaitTimer');
        }
    }
    if (bready) alert('Якісь подальші дії');
}
/* ----------------------------------------------------------------------
                Функція перевіряє, чи масив порожній
-----------------------------------------------------------------------*/
function checkArrayOnEmpty(arr) {
        for (let value of arr)
            if (value !== undefined) return false;
        return true;
    }

/* ----------------------------------------------------------------------
    Функція керує доступністю елементів сторінки по ідентифікатору
    !!!! Перевірка на нуль потім викинеться, бо зараз я багато туплю
-----------------------------------------------------------------------*/
function setEnableElements(slist, boolval) {
    if (slist !== null) {
        for (let id of slist)
            getElementEx('Функція setEnableElements', id).disabled = !boolval;
    }
}

/* ----------------------------------------------------------------------
Функція є вертає елемент html сторінки. Повідомить якщо елемента з вказаним ідентифікатором немає (корисно, але потім прибрати )
-----------------------------------------------------------------------*/
function getElementEx(invoker, element_id, find_by_name=false, silent=false) {
    let element;
    if (find_by_name)
        element = document.getElementsByName(element_id);
    else
        element = document.getElementById(element_id);
    if (!silent) {
        // if (element === null)
        //     alert(invoker + ': Елемент з ' + (find_by_name ? 'назвою' : 'ідентифікатором') + ' [' + element_id + '] відсутній на сторінці');
    }
    return element;
}


/* ----------------------------------------------------------------------
Функція перетворює джерело події в номер біту відповідно до формату.
                        При помилці повертає null
-----------------------------------------------------------------------*/
function getBitByFormat(source, format) {
    let sources;
    let bsucc = true;
    switch (format) {
            //---- Значення біт формату джерел пуску осцилографа ----
        case 'BIT017':
            sources = {'Пуск МСЗ-1': 0, 'Пуск СВ-1': 1, 'Пуск СВ-2': 2, 'Пуск ЗНЗ-1': 3, 'Пуск ЗНЗ-2': 4,
                       'Пуск МСЗ-2': 5, 'Робота МСЗ-1': 8, 'Робота СВ-1': 9, 'Робота СВ-2': 10, 'Робота ЗНЗ-1': 11,
                       'Робота ЗЗ': 12, 'Робота ЗНЗ-2': 13, 'Робота МСЗ-2': 14 };
            break;
            //---- Значення біт формату джерел спрацювання KL-1, 2, 3 ----
        case 'BIT018':
            sources = {'Пуск МСЗ-1': 0, 'Пуск МСЗ-2': 1, 'Робота ЗНЗ-2': 6, 'Робота МСЗ-2': 7, 'Робота МСЗ-1': 8,
                       'Робота СВ-1': 9, 'Робота СВ-2': 10, 'Робота ЗНЗ-1': 11, 'Робота ЗЗ': 12, 'Робота АЧР': 13,
                       'Робота АПВ': 14, 'Ресурс ВВ закінчується': 15 };
            break;
            //---- Значення біт формату джерел спрацювання KL-4, Дешунтування ----
        case 'BIT18A':
            sources = {'Робота ЗНЗ-2': 6, 'Робота МСЗ-2': 7, 'Робота МСЗ-1': 8,'Робота СВ-1': 9, 'Робота СВ-2': 10,
                       'Робота ЗНЗ-1': 11, 'Робота ЗЗ': 12, 'Робота АЧР': 13, 'Ресурс ВВ закінчується': 15 };
            break;
            //---- Значення біт формату джерел спрацювання світлодіодів ----
        case 'BIT024':
            sources = {'Пуск МСЗ-1': 0, 'Пуск МСЗ-2': 1, 'Робота ЗНЗ-2': 5, 'Готовність АПВ': 6, 'Робота МСЗ-2': 7,
                       'Робота МСЗ-1': 8, 'Робота СВ-1': 9, 'Робота СВ-2': 10, 'Робота ЗНЗ-1': 11, 'Робота ЗЗ': 12,
                       'Робота АЧР': 13, 'Робота АПВ': 14, 'Ресурс ВВ закінчується': 15 };
            break;
            //---- Значення біт формату контролю ресурсу вимикача ----
        case 'BIT029':
            sources = {'Робота МСЗ-1': 0, 'Робота МСЗ-2': 1, 'Робота СВ-1': 2, 'Робота СВ-2': 3, 'Робота ЗНЗ-1': 4,
                       'Робота ЗНЗ-2': 5, 'Робота ЗЗ': 6};
            break;
        case 'BIT021':
                sources = {'Скидання по БКВ':0, 'Скидання по квитуванню':1};
                break;
        case 'BIT24A':
            sources = {'DI-1 прямо': 0, 'DI-2 прямо':1, 'DI-3 прямо':2, 'DI-4 прямо':3,
                'DI-1 обернено':8, 'DI-2 обернено':9, 'DI-3 обернено':10, 'DI-4 обернено':11};
            break;
        case 'BIT17A':
            sources = {'DI-1 прямо': 0, 'DI-2 прямо': 1, 'DI-3 прямо': 2, 'DI-4 прямо': 3};
            break;
        default:
            console.log('Не коректний формат ' + format);
            bsucc = false;
            break;
    }
    if (bsucc) {
        if (sources.hasOwnProperty(source))
            return sources[source];
        else
            console.log('Джерело ' + source + ' не коректне для формату ' + format);
    }
    return null;
}

/* ----------------------------------------------------------------------
Функція перевіряє, чи текстове значення складається з символів 0 та 1 та не довше 16 сиволів
!!!!! Треба зробити через регулярний вираз, але я тупий, сука бля
-----------------------------------------------------------------------*/
function checkBitsValue(value) {
    if (value === null) return false;
    let bsucc = value.length < 17;
    if (bsucc) {
        value = value.split('');
        for (let i of value) {
            // bsucc = (i === '0') || (i === '1')
            bsucc = (['0', '1'].indexOf(i) >= 0);
            if (!bsucc) break;
        }
    }
    return bsucc;
}

/* ----------------------------------------------------------------------
    Функція запускає/зупиняє головний таймер очікування відповідей
-----------------------------------------------------------------------*/
function waitForAnswersTimer(turn) {
    if (turn) {
        if (timers['idWaitforAnswersTimer'] === null) {
            timers['idWaitforAnswersTimer'] = setInterval(waitForAnswer, 1000);
            console.log('Старт головного таймера очікування: ' + timers['idWaitforAnswersTimer'].toString());
        } else {
            // console.log('Головний таймер очікування існує: ' + timers[idWaitforAnswersTimer].toString());
        }
    } else {
        if (timers['idWaitforAnswersTimer'] === null) {
            console.log('Головний таймер очікування зупинений');
        } else {
            console.log('Зупинка головного таймера очікування: ' + timers['idWaitforAnswersTimer'].toString());
            clearInterval(timers['idWaitforAnswersTimer']);
            timers['idWaitforAnswersTimer'] = null;
        }
    }
}

/* ----------------------------------------------------------------------
    Функція створює словник значень для параметру sources при створенні об'єкту класу MultiCheckbox
    Виненсена в окрему функцію тому що використання індекса в ключі {'key'+i:value} не дозволяється
-----------------------------------------------------------------------*/
function BuildDictForSource(obj_ids, values, obj_index) {
    let dict = {};
    let key;
    for (let i in obj_ids) {
        key = obj_ids[i]+obj_index;
        dict[key] = values[i];
    }
    return dict;
}

/* ----------------------------------------------------------------------
    Функція вертає id елемента, значення якого щойно збережене/ не збрежене
-----------------------------------------------------------------------*/
function getMultiElementId(obj_id, value) {
    let isSingle = false, isRadio = false;
    if (getElementEx('', obj_id,false, true) !== null) {
        isSingle = true;
    }
    else {
        const obj = getElementEx('',obj_id,true, true);
        isRadio = (obj !== null);
        if (isRadio) {
            for (let i in obj) {
                isRadio = (obj[i].toString() === '[object HTMLInputElement]');
                if (isRadio) break
            }
        }
    }
    if (isSingle || isRadio) {
        // console.log('obj_id = ' + obj_id);
        return obj_id;
    }
    else {
        for (let id in htmlObjects[obj_id].src) {
            if (htmlObjects[obj_id].savedval[id] === value) {
                // console.log('obj_id = ' + id);
                return id;
            }
        }
        return null;
    }
}

function showDict(xdict) {
    console.log('----------- Debug ---------------');
    for (let id in xdict)
        console.log('Key:' + id + ', Value:' + xdict[id]);
    console.log('--------- End Debug -------------');
}

// Функція корегує значення якщо довжина тексту параметру менша двох символів - додає ведучий нуль
function twoSym(value) {
    value = String(value);
    if (value.length < 2) value = '0' + value;
    return value;
}

// Функція перевіряє чи параметр число та входження його в задані межі
function checkNumber (value, min, max) {
       let bok = !isNaN(value);
       if (bok) {
          value = Number(value);
          bok = (value >= min) && (value <= max);
       }
       return bok;
    }

// Функція викликається таймерами годинників форми налаштування часу та перенаправляє потік у вказані методи об'єкту класу DateTime
// !!! Винесена назовні, тому що this чомусь не передається через таймер, або я щось тупив. Спробувати ще раз
function recallTimerMethod(obj_id, mechanic) {
    htmlObjects[obj_id].mechanic_val(mechanic);
}

// Функція замінює в рядку всі символи substr на символи newstr. Треба переробити на регулярні вирази, бо зараз я тупий
function replace(str, substr, newstr) {
  let before;
  let after = str;
  do {
    before = after;
    after = before.replace(substr, newstr);
  } while (after !== before);
  return after;
}

// Функція перевіряє коректність призначеного номеру входу
function checkDInumber(dinum ) {
    if (dinum.length === 2) {
        return (['p', 'i'].indexOf(dinum[0]) >= 0) && (['0', '1', '2', '3', '4'].indexOf(dinum[1]) >= 0);
    }
    return false;
}

// Функція по стану входу БКВ визначає стан вимикача
function getVVvalue(bkv, statusDI) {
    let value, xbit, bsucc = false;
    if (checkDInumber(bkv)) {
        if (bkv[1] === '0') {
            return '-';    // Стан вимикача визначити не можливо
        }
        else {
            if (statusDI.length >= 4) {
                xbit = (statusDI.split('').reverse()[Number(bkv[1]) - 1]);
                if (['0', '1'].indexOf(xbit) >=0) {
                    value = (xbit === '1');
                    if (bkv[0] === 'i') value = !value;
                    return value ? '1' : '0';       // Стан вимикача визначений з урахуванням інверсії
                }
            }
        }
    }
    return '';  // Стан вимикача не визначається, так як якісь дані пошкоджені
}

// Функція перевіряє коректність зчитаного значення входу
function checkAnswerWithDI(dinum, bwithinverse) {
    if (dinum.length === 2) {
        const direct = bwithinverse ? ['i','p'] : ['p'];
        if (direct.indexOf(dinum[0]) >=0) {
            return (['0','1','2','3','4'].indexOf(dinum[1])>=0);
        }
    }
    return false;
}

// Функція виводить в консоль рамку заданої довжини з текстом, відцентрованим поцентру
function outHeadToConsole (name, wd=75) {
    if (name.length > (wd-2))
        name = name.substr(0,wd-2);
    const lfwd = parseInt((wd-2-name.length)/2);
    const rtwd = wd - name.length - lfwd-2;
    const head = '#' + '-'.repeat(wd-2) + '#\n|' + ' '.repeat(lfwd) + name + ' '.repeat(rtwd) + '|\n#' +
        '-'.repeat(wd-2) + '#';
    console.log(head);
}