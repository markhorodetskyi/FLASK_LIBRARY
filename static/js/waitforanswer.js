'use strict';
/* ---------------------------------------------------------------------------------------------------------------------
1. Всі елементи на сторінці мають свій клас, що описує сам об'єкт, існуюче значення, межі, крок, інше
2. +Всі елементи (або групи з об'єктів) як об'єкти відповідних класів зберігаються в словнику htmlObjects

 <<<<<<<<====Загальний алгоритм, як працюватиме скрипт по зчитуванню даних та заповненню елементів форми: ====>>>>>>>>

3. Під час завантаження сторінки:
    3.1. +Формуються всі змінні та починається з'єднання з MQTT сервером
    3.2. +Конструктори всіх об'єктів створюють запити на отримання первинних даних від пристрою (з'єднання ще немає)
         +Якщо створення масиву елементів сторінки htmlObjects перенести в onConnect - то на час відсутності з'єднання
         +не будуть працювати кнопки кроків та перевірки меж (щонайменше для елементів edit).
    3.3. +Вмикаються таймери очікування MQTT з'єднання (sendSomething)
4. +При появі з'єднання всі запити відправляються та додаються в масив bufferMqqtRequests (в нінець дописується id об'єкта)
5. +Вмикається таймер очікування відповідей, що запускає функцію waitForAnswer.
6. +Коли відповіді надходять - вони додаються в масив bufferMqqtRequests
7. Функція waitForAnswer:
    7.1. +зупиняє таймер очікування відповідей якщо масив запитів bufferMqqtRequests спорожніє.
    7.2. +Якщо в буфері відповідей bufferMqttAnswers є відповіді: послідовно для всіх відповідей
        7.2.1. +Розбирає відповідь на частини
        7.2.2. +Шукає в масиві bufferMqqtRequests відповідний запит
            7.2.2.1. +Розбирає на запчастини
            7.2.2.2. +Запит відповідний, якшо devID, команда та ключ однакові із тими, що у відповіді
            7.2.2.3. +Вертає id елемента та його індекс в масиві / якщо відповідного запиту немає - то пороблено, ігноруємо відповідь
        7.2.3. Запит знайдений:
            7.2.3.1. +В масиві елементів сторінки htmlObjects шукаємо елемент з відповідним id (він точно є, якщо немає - повідомляємо)
            7.2.3.2. +В залежності від типу елементу (текстове поле в класі) - перевіряємо значення на корректність
            7.2.3.3. +Якщо значення не коректне - встановлюємо константу помилки зчитування
            7.2.3.4. +Коректне значення виводимо на сторінку
            7.2.3.5. +Видаляємо елементи із масивів bufferMqqtRequests та bufferMqttAnswers, якщо в якомусь із масивів
                     всі елементи стали undefined - переініціалізовуємо масив []
            7.2.3.6. +Якщо масив запитів bufferMqqtRequests спорожнів - зупиняємо таймер очікування відповідей

 <<<<<<<<====Загальний алгоритм, як працюватиме скрипт по збереженнб даних та інформуванню користувача: ====>>>>>>>>

8. При натисканні кнопки зберегти запускається цикл по всіх елементах htmlObjects,
   8.1. В кожного елемента в залежності від типу (2-й агрегатор треба) перевіряється значення та формується запит до пристрою на запис
   8.2 Запускається головний таймер очікування відповіді (вже є при відправці запиту)
9. Відповіді самі навантажаться в буфер відповідей
10. Функція очікування відповіді розглядає повідомлення аналогічно читанню, тільки залежності від типу елементу немає. Виділяється тільки успіх або поразка та виводиться в консоль (поки що)
11. Якщо масив запитів bufferMqqtRequests спорожнів - зупиняємо таймер очікування відповідей
--------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------------------------------------------------------------------
*             Функція запускається таймером очікування відповіді на відправлений запит MQTT.
* При наявності не оброблених запитів та відповідей - виконує аналіз відповідей, співставляючи відповіді запитам та
* виконує ініціалізацію значення на сторінці (для get), повідомлення про успіх/невдачу (для set), покищо більше не
* реалізовано !!!. Після знаходження пари запит/відповідь - видаляє їх з відповідних буферів.
* Коли всі запити оброблені - зупиняє таймер очікування відповідей
*-------------------------------------------------------------------------------------------------------------------- */
function waitForAnswer() {

    /* Функція гарантовано розбиває повідомлення на масив логічних частин
    (Значення може містити символи поділу на частини, тому при наявності значення збирається назад) */
    function explodeToPartsAR(message, isRequest=true, checkOnly = false) {
        /* Для Request буде масив [0] - devID, [1] - Command, [2] - ClientID, [3] - modbusKey, [4] - objectID (для get)
           Для Request буде масив [0] - devID, [1] - Command, [2] - ClientID, [3] - modbusKey, [4+...] - value, [length-1] - ObjectID (для set)
           Для Answers буде масив [0] - success, [1] - devID, [2] - command(get), [3] - modbusKey, [4+...] - Value (для get)
           Для Answers буде масив [0] - success, [1] - devID, [2] - command(set), [3] - modbusKey, [4+...] - Value (для set)
    -----------------------------------
                                              Можливі варианти message:
        Запит get                                                 |         Запит set
    1. [devID|get|clientID|modbusKey|objectID] - len=5            |2. [devID|set|clientID|modbusKey|value|objectID] - len=6
                                                                  |2. [devID|set|clientID|modbusKey|va|lu|e|objectID] - len>6
        Варіанти відповідей для get                               |  Варіанти відповідей для set
    1.1. [Succ|devID|get|modbusKey|value] - len=5                 |2.1 [Succ|devID|set|modbusKey|value] - len=5
    1.2. [Succ|devID|get|modbusKey|va|lu|e] - len>5               |2.2 [Succ|devID|set|modbusKey|va|lu|e] - len>5
    */


        let result = message.split('|');

        if (result.length >= 5){
            if (checkOnly) return true;
            if (isRequest) {                        // Для запитів
                switch (result[1]) {                    // Виборка по команді
                    case 'get':                             // Для get
                        if (result.length === 5)                // 5 - це норма
                            return result;
                        break;
                    case 'tu':
                    case 'set':                             // для set
                        if (result.length === 6) {              // 6 - це норма
                            return result;
                        }
                        else {                                  // Більше 6 - це пишеться складне значення
                            let value = [];                         // Збираємо значення в одне ціле
                            for (let i=4; i<result.length-1; i++)
                                value.push(result[i]);
                            value = value.join('|');
                            return [result[0], result[1], result[2], result[3], value, result[result.length-1]];
                        }
                    break;
                }
            }
            else {                              // Для відповідей - відповіді для get і set ідентичні !!! коли буду обробляти tu може бути нюанс
                if (result.length === 5) {          // 5 - це норма
                    return result;
                }
                else {                              // більше 5 - це зчитане/записане складне значення
                    let value = [];
                    for (let i=4; i<result.length; i++)
                        value.push(result[i]);
                    value = value.join('|');
                    return [result[0], result[1], result[2], result[3], value];
                }
            }
        }
        console.log('Повідомлення [' + message + '] не коректне і не розглядається');
        return checkOnly ? false : null;
    }

    /* Функція перевіряє, чи відповідає певна відповідь певному запиту
       Вертає переробленимй масив з значеннями: [devID, success, command, value, objectID]     */
    function checkRequestMatchingAnswer(requestIndex, answerIndex) {
        const reqPart = explodeToPartsAR(bufferMqqtRequests[requestIndex],true);  // Запит формується скриптом і не може бути не коректним
        const answPart = explodeToPartsAR(bufferMqttAnswers[answerIndex], false);   // Відповідь прилітає по MQTT і може бути не коректною
        if (answPart === null) {
            return null;
        }
        else {
            let objectIDindex, isSet;
            // Відповіль відповідає запиту - тоді, коли однакові в запиті та відповіді:
            isSet = (['set', 'tu'].indexOf(answPart[2]) >=0);
            let bmatch = false;
            if (answPart[1] === reqPart[0]) {                       // Номер пристрою збігається get, set, tu
                if (answPart[2] === reqPart[1]) {                   // Команда збігається get, set, tu
                    if (answPart[3] === reqPart[3]) {               // Ключ modbus збігається get, set, tu
                        if (isSet)
                            bmatch = (answPart[4] === reqPart[4]);  // Значення збігається set, tu
                        else
                            bmatch = true;
                    }
                }
            }
            objectIDindex = (isSet) ? 5: 4;
            if (bmatch) {
                //    Номер пристрою,  успіх,      команда,    значення,         objectID
                return [answPart[1], answPart[0], answPart[2], answPart[4], reqPart[objectIDindex]];
            };
        }
        return false;
    }


    if (bufferMqqtRequests.length === 0) {                  // Якщо всі запити опрацьовані
        waitForAnswersTimer(false);                     // Зупиняємо головний таймер очіківння відповідей
    }
    else {                                                                      // Якщо ще не всі запити опрацьовані
        let answIndex, reqIndex, resmatch;
        if (bufferMqttAnswers.length > 0) {                                             // Якщо ще э не опрацьовані відповіді
            for (answIndex in bufferMqttAnswers) {                                          // Переглядаємо масив відповідей
                // Тіло циклу переварювання відповідей
                if (bufferMqttAnswers[answIndex] === undefined) continue;                       // Якщо відповідь вже опрацьована та видалена - переходимо до наступної
                if (!explodeToPartsAR(bufferMqttAnswers[answIndex], false, true)){           // Якщо відповідь не корректна
                    delete bufferMqttAnswers[answIndex];                                            // Видаляємо цю відповідь
                    if (checkArrayOnEmpty(bufferMqttAnswers)) {                                 // Якщо не оброблених відповідей вже немає
                        bufferMqttAnswers = [];                                                     // Очищуємо масив відповідей
                        break;                                                                      // Припиняємо перегляд відповідей (таймер не зупиняємо)
                    }
                    else {                                                                        // Якщо не оброблені відповіді ще є
                        continue;                                                                       // Переходимо до наступної відповіді
                    }
                }
                for (reqIndex in bufferMqqtRequests) {                                          // Переглядаємо масив запитів
                    if (bufferMqqtRequests[reqIndex] === undefined) continue;                       // Якщо запит вже опрацьований та видалений - переходимо до наступного
                    resmatch = checkRequestMatchingAnswer(reqIndex, answIndex);                       // Порівнюю запит з відповіддю
                    if ((resmatch !== null) && (resmatch !== false)) {                                // Якщо знайдена пара (Запит - Відповідь)
                        //------------ Пара знайдена ------------
                        const objectKey = resmatch[4];
                        // Видалення запиту з масиву запитів та зупинка таймера очікування
                        delete bufferMqqtRequests[reqIndex];
                        if (checkArrayOnEmpty(bufferMqqtRequests)) {
                            bufferMqqtRequests= [];
                            waitForAnswersTimer(false);
                        }
                        // Видалення запиту з масиву відповідей
                        delete bufferMqttAnswers[answIndex];
                        if (checkArrayOnEmpty(bufferMqttAnswers)) bufferMqttAnswers = [];
                        if (objectKey in htmlObjects) {
                            let msg;
                            switch (resmatch[2]) {
                            case 'get':
                                htmlObjects[objectKey].initValue(resmatch[3]);
                                break;
                            case 'set':
                                // Вирішуємо питання ідентифікації елементу відправника для декількох значень з одного джерела
                                let xid = getMultiElementId(objectKey, resmatch[3]);
                                switch (resmatch[1]) {
                                    case '1':
                                        msg = 'Значення ['+ resmatch[3] +'] елементу ' + ((xid === null) ? htmlObjects[objectKey].objectid : xid) + ' успішно збережено в пристрій ' + resmatch[0];
                                        if (xid === null) {                                         //Пишемо multichek одним значенням
                                            if (htmlObjects[objectKey].hasOwnProperty('savedval')) {
                                                htmlObjects[objectKey].savedval[xid] = 'save';
                                            }
                                        }
                                        else {
                                            xid = htmlObjects[objectKey].objectid;
                                            if (htmlObjects[objectKey].hasOwnProperty('savedval')) {
                                                console.log('2. Curent id=' + xid +' with value [' + htmlObjects[objectKey].savedval[xid]+']');
                                                htmlObjects[objectKey].savedval[xid] = 'save';
                                                console.log('3. Curent id=' + xid +' new value [' + htmlObjects[objectKey].savedval[xid]+']');
                                            }
                                        }
                                        htmlObjects[objectKey].reinit(xid === null);
                                        break;
                                    case '0':
                                        msg = 'Значення елементу ' + htmlObjects[objectKey].objectid + ' в пристрій ' + resmatch[0] + ' не записано';
                                        break;
                                    default:
                                        msg = 'Результат збереження значення елементу ' + htmlObjects[objectKey].objectid + ' в пристрій ' + resmatch[0] + ' не відомий';
                                        break;
                                }
                                // !!! Тут має виводитися результат успішності запису. Поки що вивід в консоль
                                console.log(msg);
                                break;
                            case 'tu':
                                // Вирішуємо питання ідентифікації елементу відправника для декількох значень з одного джерела
                                if (['0','1'].indexOf(resmatch[1]))
                                    msg = 'Команда "' + htmlObjects[objectKey].description + '" ' +((resmatch[1] === '1') ? '': 'не ') + 'виконана';
                                else
                                    msg = 'Результат виконання команди ' + htmlObjects[objectKey].description + ' в пристрій ' + resmatch[0] + ' не відомий';
                                msg = msg + ' (для елементу ' + htmlObjects[objectKey].objectid + ')'
                                console.log(msg);
                                htmlObjects[objectKey].update();
                                break;
                            default:
                                console.log('Для команди ' + resmatch[1] + ' не передбачений обробник');
                                break;
                            } // Виборка для команд
                        }
                        else {
                            console.log('Елемент ' + objectKey + ' відсутній на сторінці');
                        }
                    //------------ Кінець Пара знайдена ------------
                        break;
                    }
                }
            } // Цикл обробки масиву відповідей
        }
        else {
            console.log('Буфер повідомлень порожній');
        }
    }
}
