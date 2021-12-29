'use strict';
/*----------------------------------------------------------------------------------------------------------------------
                                Клас опису об'єкту кнопки (телеуправління / переходу, дощо)
 ----------------------------------------------------------------------------------------------------------------------
 key -                   Ключ Modbus який буде надісланий у запиті до пристрою у відповідному методі
 obj_id                - id кнопки (елементу input типу button) на html сторінці
 value                 - Текстове значення яке буде передане для запису в пристрій (для ТУ це '0' та '1') або довільне значення
                         для використання в механіці
 method                - Алгоритм методу command, який буде виконаний для кожної окремої кнопки (пишеться під кожну кнопку)
 description           - Опис дії, що буде виведений в консоль після отримання від пристрою відповіді про успіх/провал команди
 after_answer_function - Функція блоку головного селектора, в якій здійснюється створення об'єкту кнопки.
                         Використовуэться для оновлення сторінки без її перегавантаження після отримання відповіді від
                         пристрою щодо  виконання команди (метод update). Впроваджено для сторінки телеуправління,
                         решта кнопок параметр можуть не використовувати
----------------------------------------------------------------------------------------------------------------------*/
class CommandButton {
    constructor (key, obj_id, value, method='', description='', after_answer_function = null) {
        this.key = key;
        this.objectid = obj_id;
        this.obj = getElementEx('Конструктор CommandButton', obj_id);
        this.value = value;
        this.description=description;
        this.method = method;
        this.update_func = after_answer_function;
    }

    initValue() { /* Заглушка для стандартизації */ }

    reinit() { /* Заглушка для стандартизації */ }

    save() { /* Заглушка для стандартизації */
        return 0;
         }

    update() { /* Оновлює сторінку після отримання результату виконання команди (тільки для ТУ) */
        console.log('Очистка htmlObjects');
        for (let objectid in htmlObjects) {
            if ((objectid.substr(0,3) === 'spn') || (objectid === 'btnSwitchKL4')) {
                htmlObjects[objectid].orig = null;
                console.log('Очистка:'+objectid);
                htmlObjects[objectid].initValue('-----');
            }
        }
        this.update_func();
    }

    /* Перелік алгоритмів, одна з яких буде виконана при натисканні кнопки */
    command() {
        switch (this.method) {
            case 'sendValue':
                requestSaveValue(this, this.value,'tu');
                break;
            case 'switchKL4':
                let value = htmlObjects['spnStatusKL4'].orig;
                switch (value) {
                    case '0':
                        value = 1;
                        break;
                    case '1':
                        value=0;
                        break;
                    default:
                        console.log('Поточний стан реле KL-4 не визначений, переключення не можливе');
                        return;
                }
                requestSaveValue(this, value,'tu');
                break;
            case 'show':                        // Метод-заглушка для не реалізованих команд ТУ (Зчитати журнали)
                alert(this.value);
                break;
            case 'openSettings':
                const url={'btnDateTime': 'settingsDateTime.html','btnSettingDI1':'settingsDI1.html',
                    'btnSettingDI2':'settingsDI2.html','btnSettingDI3':'settingsDI3.html',
                    'btnSettingDI4':'settingsDI4.html','btnSettingKL1':'settingsKL1.html',
                    'btnSettingKL2':'settingsKL2.html', 'btnSettingKL3':'settingsKL3.html',
                    'btnSettingKL4':'settingsKL4.html', 'btnSettingKL5':'settingsKL5.html',
                    'btnSettingKLD':'settingsKLD.html', 'btnSettingVD1':'settingsVD1.html',
                    'btnSettingVD2':'settingsVD2.html', 'btnSettingVD3':'settingsVD3.html',
                    'btnSettingVD4':'settingsVD4.html', 'btnSettingVD5':'settingsVD5.html',
                    'btnSettingVD6':'settingsVD6.html', 'btnSettingVD7':'settingsVD7.html',
                    'btnOscil': 'settingsOscil.html', 'btnMagLoad':'settingsMagLoad.html',
                    'btnResourceVV':'settingsResourceVV.html', 'btnTeleControl':'TU.html',
                    'btnSettingMSZ1':'settingsMSZ1.html', 'btnSettingMSZ2':'settingsMSZ2.html',
                    'btnSettingSV1':'settingsSV1.html', 'btnSettingSV2':'settingsSV2.html',
                    'btnSettingZNZ1':'settingsZNZ1.html', 'btnSettingZNZ2':'settingsZNZ2.html',
                    'btnSettingZZ':'settingsZZ.html', 'btnSettingACHR':'settingsACHR.html',
                    'btnSettingAPV':'settingsAPV.html'};
                if (this.objectid in url)
                    window.location.href = url[this.objectid];
                else
                    alert ('Fucking shit');
                break;
            default:
                console.log("Не передбачений метод " + this.method + "для об'єкту " + this.objectid);
                break;
        }

    }

} // Кінець класу CommandButton
