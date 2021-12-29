'use strict';
/* ===================================================================================================================*/
/*                                  Блок функцій - реакцій на події на html сторінці                                  */
/* ===================================================================================================================*/

// Функція зв'язування з класом NumEdit. Змінює на один крок значення числа в текстовому полі edit
function stepNumericEdit(edit_id, directSign) {
    htmlObjects[edit_id].stepChange(directSign);
}

// Функція зв'язування з класом DateTimePK. Змінює на один крок значення числа в довільному текстовому полі edit
function stepNumericGroupEdit(obj_id, edit_id, directSign) {
    htmlObjects[obj_id].stepChange(edit_id, directSign);
}

// Функція зв'язування з класом NumEdit. Перевіряє значення поля при виході із нього
function checkNumericEdit(edit_id) {
    htmlObjects[edit_id].change();
}

// Функція зв'язування з класом DateTimePK. Перевіряє значення поля при виході із нього
function checkNumericGroupEdit(obj_id, edit_id) {
    htmlObjects[obj_id].change(edit_id);
}

// Функція зв'язування з класом UseCheckbox. Змінює доступність елементів пов'язаної групи в залежності від стану чекбоксу
function groupElementUseChange(chkbx_id) {
    htmlObjects[chkbx_id].change();
}

// Функція зв'язування з класами MiltiCheckbox, BitSingleCheckbox. Реакція на зміну як одинарного так і подвійного чекбокса
//  Контроль element_pos я не роблю осознано
function CheckboxChange(obj_id, element_id = '') {
    if (element_id === '')
        htmlObjects[obj_id].change();
    else
        htmlObjects[obj_id].change(element_id);
}

// Функція на onClick мітки перед групою чекбоксів, дозволяє по різному перемикати одночасно два чекбокси
function setMultiCheckbox(obj_id) {
    htmlObjects[obj_id].groupset();
}

// Функція на onClick мітки розділу чекбоксів, міняє між собою два режими групового перемикання чекбоксів
// !!! Не реалізована, так як не знаю до чого її призначити
function changeGroupMode(obj_id) {
    htmlObjects[obj_id].changeGroupMode();
}

// Функція зв'язування з класом ComboFeatures. Реакція на зміну значення.
function ChangeCombo(obj_id) {
    htmlObjects[obj_id].change();
}

// Функція зв'язування з класом ComboDI. Реакція на зміну значення головного чекбокса, самого комбобокса та чекбокса інверсії.
function selectElementDIchange(obj_id, who) {
    htmlObjects[obj_id].change(who);
}

// Функція зв'язування з класом Radio. Реакція на зміну.
function changeRadio(obj_id) {
    htmlObjects[obj_id].change();
}

function copyNowDatetime(obj_id) {
    htmlObjects[obj_id].copyNow();
}

/* Функція працює при натисканні кнопки "Зберегти", зберігає змінені значення власнимим методами класів об'єктів */
function saveChanged() {
    let count = 0;
    console.log('-------------------------------------------');
    for (let obj_id in htmlObjects)
        count = count + (htmlObjects[obj_id].save());
    if (count > 0)
        console.log('Зберігається ' + count + ' змінених значень');
    else
        console.log('Немає змінених значень');
}

/* Функція працює при натисканні кнопки "Відмінити" */
function quitWithoutSave() {
    let count = 0, list = [], change;
    for (let obj_id in htmlObjects) {
        change = htmlObjects[obj_id].changed();
        if (change) {
            list.push(obj_id);
            count++;
        }
    }

    let needSave = (count > 0);
    if (needSave) {
        const message = 'Увага!!!\nНе збережені ' + count + ' змінених значень (' + list.join(', ') + ')\n\n' +
            'Зберегти їх перед виходом ?';
        needSave = confirm(message);
        if (needSave) {
            const count = bufferMqqtRequests.length;
            saveChanged();
            timers['idSaveWaitTimer'] = setInterval(actionAfterClose, 100, true, count);
        }
    if (!needSave) actionAfterClose(false,0);
    }
}

/* Функція працює при відпусканні всіх клавіш клавіатури та при втраті фокусу елементом  */
function changeNameEdit(obj_id) {
    // console.log('object_id = '+obj_id);
    // showDict(htmlObjects);
    htmlObjects[obj_id].change();
}

/* Функція працює при переключенні будь якого елементу групи бітового вибору входів DI для VD  */
function changeUseRadio(obj_id, radio_id, bmain=false) {
    // console.log('obj_id='+obj_id+', radio_id='+radio_id+', bmain='+bmain);
    htmlObjects[obj_id].change(radio_id, bmain);
}

/* Функція перенапрявляє потік в метод command елементу obj_id.
* Кнопкам треба буде додати id та створювати для них об'єкти в htmlObjects, бо обробка зчитування журналу та осцилограм доволі складна*/
function buttonCommand(obj_id, cmd=null) {
    htmlObjects[obj_id].command(cmd);
}
