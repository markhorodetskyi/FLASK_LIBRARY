import paho.mqtt.client as mqtt
import serial
import modbus_tk
import modbus_tk.defines as cst
from modbus_tk import modbus_rtu
import json
import os
import sys
# from enum import Enum
import time
import threading
import websocket
# import websockets
import asyncio
import uuid
from websockets import WebSocketClientProtocol

# --------------------------------------------------------------------------------------------- #
#                         Перелік джерел збудження пристрою                                     #
# --------------------------------------------------------------------------------------------- #
class Sources:
    msz1_pusk = 'Пуск МСЗ-1'
    msz2_pusk = 'Пуск МСЗ-2'
    sv1_pusk = 'Пуск СВ-1'
    sv2_pusk = 'Пуск СВ-2'
    znz1_pusk = 'Пуск ЗНЗ-1'
    znz2_pusk = 'Пуск ЗНЗ-2'
    msz1_work = 'Робота МСЗ-1'
    msz2_work = 'Робота МСЗ-2'
    sv1_work = 'Робота СВ-1'
    sv2_work = 'Робота СВ-2'
    znz1_work = 'Робота ЗНЗ-1'
    znz2_work = 'Робота ЗНЗ-2'
    zz_work = 'Робота ЗЗ'
    apv_work = 'Робота АПВ'
    apv_ready = 'Готовність АПВ'
    achr_work = 'Робота АЧР'
    vv_ended = 'Ресурс ВВ закінчується'
    di1_dir = 'DI-1 прямо'
    di2_dir = 'DI-2 прямо'
    di3_dir = 'DI-3 прямо'
    di4_dir = 'DI-4 прямо'
    di1_inv = 'DI-1 обернено'
    di2_inv = 'DI-2 обернено'
    di3_inv = 'DI-3 обернено'
    di4_inv = 'DI-4 обернено'
    reset_bkv = 'Скидання по БКВ'
    reset_kvit = 'Скидання по квитуванню'


# --------------------------------------------------------------------------------------------- #
#                              Характеристики реле                                              #
# --------------------------------------------------------------------------------------------- #
class FeaturesRele:
    independent = 'Незалежна'
    norm_dependent = 'Нормально залежна'
    very_dependent = 'Сильно залежна'
    analog_rtv1 = 'Аналог РТВ-1'
    analog_rt80 = 'Аналог РТВ-4, РТ-80'


# --------------------------------------------------------------------------------------------- #
#                        Допустимі швидкості обміну з пристроєм                                 #
# --------------------------------------------------------------------------------------------- #
class Speeds:
    speed00 = '1200'
    speed01 = '2400'
    speed02 = '4800'
    speed03 = '9600'
    speed04 = '14400'
    speed05 = '19200'
    speed06 = '28800'
    speed07 = '38400'
    speed08 = '57600'
    speed09 = '76800'
    speed10 = '115200'


# --------------------------------------------------------------------------------------------- #
#           Події аварій для формату Ф20, а пакож прилаштований для Ф14 та Ф28                  #
# apv1_work та apv1_work - Первинно було з "АПВ-1/2 робота", але змінив, щоб втиснути крім      #
# формату Ф20 ще для Ф14 та Ф28                                                                 #
# --------------------------------------------------------------------------------------------- #
class CrashCode:
    nocrash = ''
    msz1 = 'МСЗ-1'
    sv1 = 'СВ-1'
    sv2 = 'СВ-2'
    msz2 = 'МСЗ-2'
    znz1 = 'ЗНЗ-1'
    znz2 = 'ЗНЗ-2'
    apv1_work = 'АПВ-1'
    apv1_no_inclusion = 'АПВ-1 Немає включення'
    apv1_fail = 'АПВ-1 Не успішне'
    apv1_succ = 'АПВ-1 Успішне'
    apv2_work = 'АПВ-2'
    apv2_no_inclusion = 'АПВ-2 Немає включення'
    apv2_fail = 'АПВ-2 Не успішне'
    apv2_succ = 'АПВ-2 Успішне'
    chapv_work = 'ЧАПВ, Робота'
    chapv_no_inclusion = 'ЧАПВ Немає включення'
    chapv_fail = 'ЧАПВ Не успішне'
    chapv_succ = 'ЧАПВ Успішне'
    achr = 'АЧР'
    ext_protect = 'Зовнішній  захист'
    resource_over = 'Ресурс ВВ вичерпаний'


# --------------------------------------------------------------------------------------------- #
#                     Стандартні монокоманди, що підтримуються програмою                        #
# --------------------------------------------------------------------------------------------- #
class StdCommands:
    scan_devices = 'scanDevices'
    stop_script = 'stopScript'
    clear_screen = 'clearScreen'
    show_devices = 'showDevices'
    monitoring = 'GetMonitoring'


# --------------------------------------------------------------------------------------------- #
#                   Відповіді на стандартні монокоманди, що підтримуються програмою             #
# --------------------------------------------------------------------------------------------- #
class StdScanResponce:
    change_name = 'NameChanged'
    new_device = 'NewDevice'
    device_missing = 'DeviceMissing'
    change_type = 'TypeChanged'
    scan_complete = 'ScanComplete'


# --------------------------------------------------------------------------------------------- #
#                   Типи пристроїв, що розпізнаються скриптом при скануванні                    #
# --------------------------------------------------------------------------------------------- #
class DeviceTypes:
    rs80mp = 'PC80-MP'
    tpm05 = 'TPM-05'
    unknown = 'UNKNOWN'


# =================== Блок функцій реалізації ведення протоколу ================================#
# --------------------------------------------------------------------------------------------- #
#                   Процедура ведення протоколу дій та помилок скрипта                          #
# --------------------------------------------------------------------------------------------- #
def log_write(msg, bonlyscreen = False):
    if not POINT.silent:
        b = time.localtime()
        strtime = '%s.%s.%s %s:%s:%s ' % \
                  (val_to_strlen(b.tm_mday, 2), val_to_strlen(b.tm_mon, 2), val_to_strlen(b.tm_year, 4),
                   val_to_strlen(b.tm_hour, 2), val_to_strlen(b.tm_min, 2), val_to_strlen(b.tm_sec, 2))
        count = 0
        p2 = msg[0:1:1]
        while p2 == '\n':
            count = count + 1
            msg = msg[1:len(msg):1]
            p2 = msg[0:1:1]
        msg = '\n'*count+strtime + msg
        print(msg)
        if not bonlyscreen:
            write_currentlog(msg)

# --------------------------------------------------------------------------------------------- #
#                     Процедура записує повідомлення в файл протоколу                           #
# --------------------------------------------------------------------------------------------- #
def write_currentlog(smsg):
    global SCRIPT_PATH
    pathsep = '/' if os_is_linux() else '\\'  # Обираємо розділювач
    curr_sname = 'Script_current.~log'
    log_path = SCRIPT_PATH + 'Logs' + pathsep
    if not os.path.exists(log_path):
        os.mkdir(log_path)
    key = 'a' if os.path.exists(log_path + curr_sname) else 'w'
    try:
        curr_file = open(log_path + curr_sname, key)
        curr_file.write(smsg +'\n')
        curr_file.close()
    except PermissionError:
        log_path = log_path + curr_sname
        log_write('Неможливо відкрити файл %%. Збереження протоколу у файл не здійснюється' % log_path, True)


# --------------------------------------------------------------------------------------------- #
#      Процедура при старті скрипта виконує перейменування файлу Script_current у               #
#  (Script_YYYY-MM-DD_HH-mm-SS.log якщо він починається коректно і Script_broken_ХХХХХ.log якщо #
#  він починається не коректно) попереднього протоколу та створює новий файл протоколу і        #
#  записує в нього коректний заголовок із датою та часом пуску.                                 #
# --------------------------------------------------------------------------------------------- #
def onstart_log_prepare():
    global SCRIPT_PATH
    pathsep = '/' if os_is_linux() else '\\'                                    # Обираємо розділювач
    SCRIPT_PATH = os.path.abspath(os.path.dirname(sys.argv[0])) + pathsep       # Отримуємо шлях до поточної директорії
    curr_sname = 'Script_current.~log'                                          # Назва файлу в який буде здійснюватися запис протоколу
    broke_sname = 'Script_broken_%s.log'                                        # Шаблон назви не впізнаного файлу
    if os.path.exists(SCRIPT_PATH):                                             # Якщо поточний шлях є (дурна перевірка)
        log_path = SCRIPT_PATH + 'Logs' + pathsep                                   # Створюємо шлях до директорії Logs
        if not os.path.exists(log_path):                                            # Якщо директорії Logs ще немає
            os.mkdir(log_path)                                                          # Створбємо її
        if os.path.exists(log_path + curr_sname):                                   # Якщо файл для запису існує (попередній)
            curr_file = open(log_path + curr_sname, 'r')                                # Відкриваємо його
            sline = curr_file.read(56)                                                  # Читаємо з нього перший рядок
            curr_file.close()                                                           # Закриваємо його
            sarr = sline.split(' ')                                                     # Розбиваємо його на дату, час та решту
            sname = ''                                                                  # Ініціалізуємо майбутню назву файлу
            if len(sarr) == 6:                                                          # Якщо довжина в масиві очікувана
                if (sarr[2] == sarr[5]) and (sarr[2] == '='*10):                            # Якщо 2-й та 5-й елементи це ===========
                    sdarr = sarr[0].split('.')                                                  # Створюємо масив значень дати
                    starr = sarr[1].split(':')                                                  # Створюємо масив значень часу
                    if (len(sdarr) == 3) and (len(starr) == 3):                                 # Якщо масиви коректні
                        buff = sdarr[0]                                                             # В масиві дати міняємо місцями рік та день
                        sdarr[0] = sdarr[2]
                        sdarr[2] = buff
                        sname = 'Script_' + '-'.join(sdarr) + '_' + '-'.join(starr) + '.log'        # Формуємо назву для файлу
            if sname == '':                                                             # Якщо назва файла не створена
                i = 1                                                                       # Ініціалізуємо лічильник
                while os.path.exists(log_path + broke_sname % val_to_strlen(i, 5)):         # Шукаємо вільний індекс для не впізнаного файлу
                    i = i + 1
                sname = broke_sname % val_to_strlen(i, 5)                                   # Формуємо назву для файлу
            os.rename(log_path + curr_sname, log_path + sname)                          # Перейменовуємо файл
        b = time.localtime()                                                        # Отримуємо поточний час та дату
        strtime = '%s.%s.%s %s:%s:%s ' % \
                  (val_to_strlen(b.tm_mday, 2), val_to_strlen(b.tm_mon, 2), val_to_strlen(b.tm_year, 4),
                   val_to_strlen(b.tm_hour, 2), val_to_strlen(b.tm_min, 2), val_to_strlen(b.tm_sec, 2)) # Формуємо текст дати та часу
        curr_file = open(log_path + curr_sname, 'w')                                # Створюємо новий поточний файл
        sline = strtime + '=' * 10 + ' ЗАПУСК СКРИПТА ' + '=' * 10                  # Готуємо для ідентифікаційний рядок
        curr_file.write(sline + '\n')                                               # Пишемо ідентифікаційний рядок в файл
        curr_file.close()                                                           # Закриваємо файл
    else:
        log_write("Не коректна робота. sys.argv[0] вертає не існуючий шлях [%s]. Переписуй код" % SCRIPT_PATH, True)


# =========================== Блок функцій перетворення форматів ============================== #
# --------------------------------------------------------------------------------------------- #
#                 Функція перетворює текст в перелік двохбайтових чисел                         #
# --------------------------------------------------------------------------------------------- #
def convert_string_to_list(stext):
    xlist = []
    stext = stext.encode('cp1251')
    xlen = len(stext)
    for i in range(0, xlen, 2):
        xword = stext[i] * 256
        if (i+1) < xlen:
            xword = xword + stext[i + 1]
        xlist.append(xword)
    return xlist


# --------------------------------------------------------------------------------------------- #
#                     Функція перетворює перелік двохбайтових чисел в текст                     #
# --------------------------------------------------------------------------------------------- #
def convert_list_to_string(xlist):
    stext = ''
    for xword in xlist:
        if xword != 0:
            hl = explode_reg_to_bytes(xword)
            s = hex(hl[0]).split('x')[-1]
            if s != '0':
                stext = stext + s
            s = hex(hl[1]).split('x')[-1]
            if s != '0':
                stext = stext + s
    stext = bytes.fromhex(stext).decode('cp1251')
    # Якщо текст складається з всіх байт FF, замінемо його константою
    if stext == 'я' * len(xlist) * 2:
        stext = 'RANDOM_FF'
    return stext


# --------------------------------------------------------------------------------------------- #
#                 Функція відновлює 4-х символьну HEX адресу з десяткового числа                #
# --------------------------------------------------------------------------------------------- #
def hex_ex(xint):
    def hex2sym(xbyte):
        xbyte = hex(xbyte)
        xbyte = val_to_strlen(xbyte[2:len(xbyte):1], 2)
        return xbyte

    hl = explode_reg_to_bytes(xint)
    res = hex2sym(hl[0]) + hex2sym(hl[1])
    return res.upper()


# --------------------------------------------------------------------------------------------- #
#                 Функція розбиває 16-ти бітне ціле на старший та молодший байти                #
# --------------------------------------------------------------------------------------------- #
def explode_reg_to_bytes(reg):
    xhi = int(reg / 256)
    xlo = reg-xhi * 256
    return xhi, xlo


# --------------------------------------------------------------------------------------------- #
#    Функція перетворює ціле число в строку заданої довжини, не менше кількості символів числа  #
# --------------------------------------------------------------------------------------------- #
def val_to_strlen(xint, xlen=0):
    sint = str(xint)
    if xlen > 0:
        if len(sint) < xlen:
            sint = '0' * (xlen - len(sint)) + sint
    return sint


# --------------------------------------------------------------------------------------------- #
#       Функція ділить ціле число на ділитель та перетворює його в строку із заданою кількістю  #
#              знаків після коми (Ділитель це тільки 1, 10, 100, 1000)                          #
# --------------------------------------------------------------------------------------------- #
def convert_reg_to_strfloat(reg, divider, digits=0):
    if divider in (1, 10, 100, 1000):
        res = str(reg / divider).split('.')
        sf = str(res[1])
        if digits <= 0:
            digits = len(sf)
            if divider == 1:
                return str(reg)
        if digits > len(sf):
            sf = sf + '0' * (digits - len(sf))
        else:
            sf = sf[0:digits:1]
        return str(res[0])+'.'+sf


# --------------------------------------------------------------------------------------------- #
#       Функція перетворює текстовебітове уявлення числа в число з контролем значення           #
# --------------------------------------------------------------------------------------------- #
def convert_strbin_to_reg(strbin):
    xreg = None
    strbin = str(strbin)
    if len(strbin) > 16:
        log_write('Значння [%s] буде обрізане до 16 біт від молодшого' % strbin)
        strbin = strbin[::-1][0:16:1][::-1]
    try:
        xreg = int('0b'+strbin, 2)
    except ValueError:
        log_write('Значння [%s] не може бути перетворене в число' % strbin)
    return xreg


# --------------------------------------------------------------------------------------------- #
#       Функція перетворює невідоме значення в число з можливісю повернення цілого.             #
#       Якщо значення не числове - повернеться значення по замовчнню                            #
# --------------------------------------------------------------------------------------------- #
def convert_value_to_numeric_def(value, forceint=False, default=None):
    if value is None:
        res = default
    else:
        if type(value) == int:
            res = value
        elif type(value) == float:
            if forceint:
                res = int(value)
            else:
                res = value
        else:
            try:
                res = float(value)
                if forceint:
                    res = int(res)
            except ValueError:
                res = default
            except Exception as e:
                print(e)
    return res


# --------------------------------------------------------------------------------------------- #
#   Функція перетворює ціле 16 бітне число на строку із зазначеної кількості біт від молодшого  #
# --------------------------------------------------------------------------------------------- #
def convert_reg_to_strbin(reg, bits=16):
    if (bits <= 0) or (bits > 16):
        bits = 16
    reg = abs(convert_value_to_numeric_def(reg, True, 0))
    sbin = bin(reg)
    sbin = sbin[2: len(sbin): 1]
    if len(sbin) > 16:
        sbin = sbin[::-1][0:16:1][::-1]
    else:
        sbin = '0' * (16 - len(sbin)) + sbin
    sbin = sbin[16 - bits:16:1]
    return sbin


# --------------------------------------------------------------------------------------------- #
#       Функція вертає значення біта в текстовому уявленні бітового значення (від молодшого)    #
# --------------------------------------------------------------------------------------------- #
def get_bit(strbin, xbit):
    if (xbit < 0) or (xbit > 15):
        return None
    else:
        if len(strbin) > xbit:
            return strbin[::-1][xbit]
        else:
            return 0


# --------------------------------------------------------------------------------------------- #
#     Функція встановлює значення біта в текстовому уявленні бітового значення (від молодшого)  #
# --------------------------------------------------------------------------------------------- #
def set_bit(strbin, xbit, value):
    res = None
    strbin = str(strbin)
    value = str(value)
    if value in ('0', '1'):
        strbin = strbin[::-1]
        if (xbit >= 0) and (xbit <= (len(strbin) - 1)):
            if xbit == 0:
                x1 = ''
                x2 = strbin[1:len(strbin):1]
            elif xbit == (len(strbin) - 1):
                x1 = strbin[0:len(strbin) - 1:1]
                x2 = ''
            else:
                x1 = strbin[0:xbit:1]
                x2 = strbin[xbit+1:len(strbin):1]
            res = str(x1+value+x2)[::-1]
    return res


# --------------------------------------------------------------------------------------------- #
#                               Функція вертає блок послідовних біт                             #
# --------------------------------------------------------------------------------------------- #
def extract_bits_block(strbin, frombit, count=0):
    strbin = strbin[::-1]
    xlen = len(strbin)
    if xlen < 16:
        strbin = strbin + '0' * (16 - xlen)
    elif xlen > 16:
        strbin = strbin[0:16:1]
    frombit = abs(frombit)
    if frombit > 15:
        frombit = 15
    count = abs(count)
    res = strbin[frombit:frombit + count:1]
    res = res[::-1]
    return res

# ===================== Блок функцій роботи з SERIAL портом ====================================#

# --------------------------------------------------------------------------------------------- #
#     Функція встановлює налаштування для порта та перевіряє його доступність та наявність      #
#                               Повертає True якщо порт існує.                                  #
# --------------------------------------------------------------------------------------------- #
def prepare_serial(open = False):
    # ----- Отримуємо параметри порта -----
    speed = get_config_value('Serial', 'baudRate', True, True)
    port = get_config_value('Serial', 'port' if os_is_linux() else 'port_win')
    # print(port)
    if None in (speed, port): return False

    # ----- Безумовно встановлюємо налаштування порта (помилок не виникає) -----
    if POINT.serial_port.port != port: POINT.serial_port.port = port
    if POINT.serial_port.baudrate  != speed: POINT.serial_port.baudrate = speed
    if POINT.serial_port.bytesize  != 8: POINT.serial_port.bytesize = 8
    if POINT.serial_port.parity != 'N': POINT.serial_port.parity = 'N'
    if POINT.serial_port.stopbits != 1: POINT.serial_port.stopbits = 1
    if POINT.serial_port.xonxoff != 0: POINT.serial_port.xonxoff = 0

    # ----- Тестуємо порт (якщо щось не так - виникне помилка) -----
    try:
        POINT.serial_port.open()
        if not open: POINT.serial_port.close()
        return True
    # ----- Якщо порт існує - вертаємо також True -----
    except serial.SerialException as err:
        err = str(err)
        log_write('Помилка [%s] відкриття порта [%s]' % (err, port))
        return err.find('PermissionError') > 0
    except Exception as e:
        print(e)

# --------------------------------------------------------------------------------------------- #
#                  Функція очікує звільнення зайнятого порта та відкриває його.                 #
# При настанні  несподіваної помилки (витягнули перетворювач порта) - припиняє очікування       #
# --------------------------------------------------------------------------------------------- #
def wait_for_port():
    if POINT.serial_port.is_open: return True
    wait_time = get_config_value('Other', 'checkserial_interval',True, False, 0.3)
    first = True
    timing = time.time()
    while True:
        if (time.time() - timing > wait_time) or first:
            try:
                POINT.serial_port.open()
                return True
            except serial.SerialException as err:
                err = str(err)
                if (err.find('PermissionError') > 0):
                    if first:
                        first = False
                        log_write('Порт [%s] зайнятий. Очікуємо його звільнення' % POINT.serial_port.port)
                    timing = time.time()
                else:
                    log_write('Під час очікування виникла критична помилка порта [%s]: (%s)' % (POINT.serial_port.port, err))
                    return False
            except Exception as e:
                print(e)


# =================== Блок функцій роботи з протоколм MODBUS ================================== #
# --------------------------------------------------------------------------------------------- #
#                        Функція ініціалізує зв'язок по протоколу ModBus                        #
# --------------------------------------------------------------------------------------------- #
def modbus_initconnect():
    tmout = get_config_value('Serial', 'timeout', True)
    if tmout is None: return None
    try:
        mbm = modbus_rtu.RtuMaster(POINT.serial_port)
        mbm.set_timeout(tmout)
        mbm.set_verbose(True)
        log_write('Ініціалізація порта MODBUS успішна')
        return mbm
    except modbus_tk.modbus.ModbusError as exc:
        log_write('Помилка [%s] в MODBUS модулі' % str(exc))
        return None
    except Exception as e:
        print(e)


# ----------------------------------------------------------------------------------------------#
#                           Функція сканує мережу ModBus на наявні пристрої.                    #
#                   Повідомлення про нові та відключені пристрої надсилає по MQTT               #
# ----------------------------------------------------------------------------------------------#
def modbus_scan_devices(author):
    mqtt_topic_answer = author
    mqtt_available = 'POINT' in globals()
    log_write('=== Сканування пристроїв ===')
    POINT.devices = {}

    firstdev = get_config_value('Other', 'start_device', True, True, 1 )
    enddev = get_config_value('Other', 'end_device', True, True, 247)

    # --- Перевірка початкового та кінцевого номерів для сканування ---
    bsucc = True
    if (firstdev <= 0) or (firstdev > 247):
        log_write('Номер [%s] першого пристрою для сканування, вказаний у ключі [start_device] розділу [Other] '
                  'файлу конфігурації виходить за межі можливостей мережі MODBUS (1-247)' % firstdev)
        bsucc = False
    if (enddev <= 0) or (enddev > 247):
        log_write('Номер [%s] останнього пристрою для сканування, вказаний у ключі [end_device] розділу [Other] '
                  'файлу конфігурації виходить за межі можливостей мережі MODBUS (1-247)' % enddev)
        bsucc = False
    if (firstdev > enddev) and bsucc:
        log_write('Номер [%s] першого пристрою для сканування первищує номер [%s] останнього пристрою для сканування '
                  'виправте ключі [start_device] та [end_device] розділу [Other] файлу конфігурації ' %
                  (firstdev, enddev))
        bsucc = False
    if not bsucc:
        log_write('Сканування припинено')
        return False

    # --- Опитування пристроїв ---
    if not wait_for_port(): return False                    # Якщо під час очікування порт зник або виникла інша критична помилка

    for devid in range(firstdev, enddev + 1):
        time.sleep(POINT.request_time)
        val = modbus_read_ex(devid, 0, 1, True)
        if val:
            log_write('Пристрій %s в мережі' % devid)
            # ----- Ідентифікація пристрою та зчитування базових значень для кожного типу -----
            devtype = device_identification(devid)
            POINT.devices[str(devid)] = {'Type': devtype}
            if devtype == DeviceTypes.unknown:
                log_write('Пристрій з номером %s не ідентифікований' % devid)
                # Нічого з нього не вичитуємо додатково
            else:
                log_write('Пристрій з номером %s ідентифікований як %s' % (devid, devtype))
                if devtype == DeviceTypes.rs80mp:
                    # Вичитуємо з пристрою назву фідера та ділитель 3І0 та мінімальне і максимальне 3І0
                    sname = get_device_stdinfo(devid, 1)
                    div3i0 = convert_value_to_numeric_def(get_device_stdinfo(devid, 2), True)
                    min3i0 = convert_value_to_numeric_def(get_device_stdinfo(devid, 3), True)
                    max3i0 = convert_value_to_numeric_def(get_device_stdinfo(devid, 4), True)
                    if None in (sname, div3i0, min3i0, max3i0):
                        log_write('Помилка вичитування даних з пристрою %s' % devid)
                        return False
                    else:
                        POINT.devices[str(devid)].update({'FidName': sname, 'Div3I0': div3i0,
                                                    'Min3I0': min3i0 / div3i0, 'Max3I0': max3i0 / div3i0})
                elif devtype == DeviceTypes.tpm05:
                    # Вичитуємо з пристрою Ктс та Ктн
                    kts = convert_value_to_numeric_def(get_device_stdinfo(devid, 5), True)
                    ktn = convert_value_to_numeric_def(get_device_stdinfo(devid, 6), True)
                    if None in (kts, ktn):
                        log_write('Помилка вичитування даних з пристрою %s' % devid)
                        return False
                    else:
                        POINT.devices[str(devid)].update({'Kts':kts, 'Ktn':ktn})
            # ------------------------------------------------------------------
        else:
            log_write('Пристрій %s відсутній' % devid)
    log_devices('Відповіли %s пристроїв:' % str(len(POINT.devices)), POINT.devices)
    # ------------------------------------------------------------------------- #
    # 1. Зареєстрований пристрій може не відповісти                             #
    # 2. Незареєстрований пристрій може відповімти                              #
    # 3. Зареєстрований пристрій, що відповів, міг змінити тип                  #
    # 4. Зареєстрований пристрій РС-80, що відповів, міг змінити назву фідера   #
    # ------------------------------------------------------------------------- #
    if get_config_value('Device'):
        # --------------------------- Перевірка на появу нових пристроїв ----------------------------
        # log_write('Зареєстровані пристрої: [%s]' % CONFIG['Device'])
        log_devices('Зареєстровані пристрої:', POINT.configuration['Device'])
        for devid in POINT.devices:
            if devid in POINT.configuration['Device']:
                # Якщо пристрій зареєстрований в конфігу (відомий пристрій)

                old_type = get_config_value2('Device', devid, 'Type')
                if POINT.devices[devid]['Type'] == old_type:
                    # Якщо тип пристрою не змінився - робимо перевірки для кожного з типів

                    if old_type == DeviceTypes.rs80mp:
                        # Для пристрою РС80-МР перевіряємо, чи не змінилася назва фідера

                        old_name = get_config_value2('Device', devid, 'FidName')
                        if POINT.devices[devid]['FidName'] != old_name:
                            # Якщо назфа фідера змінилася

                            log_write('Пристрій [%s] [%s] змінив назву з [%s] на [%s]' %
                                      (DeviceTypes.rs80mp, devid, old_name, POINT.devices[devid]['FidName']))
                            if mqtt_available:
                                message = '1|%s|%s|%s|%s' % (StdCommands.scan_devices, StdScanResponce.change_name,
                                                             devid, POINT.devices[devid]['FidName'])
                                text_data = json.dumps([3, None, {'message': message}, 'NameChanged'])
                                POINT.send(text_data)
                                # CONNECTION.publish(mqtt_topic_answer, message, qos=0)

                    elif old_type == DeviceTypes.tpm05:
                        # Для пристрою TPM-05 нічого не перевіряємо
                        pass
                    elif POINT.devices[devid]['Type'] == DeviceTypes.unknown:
                        # Для не ідентифікованого пристрою нічого не перевіряємо
                        pass
                else:
                    # Якщо тип пристрою змінився - відправляємо повідомлення про зміну типу та новий тип
                    log_write('Пристрій [%s] змінив тип з [%s] на [%s]' % (devid, old_type, POINT.devices[devid]['Type']))
                    if mqtt_available:
                        message = '1|%s|%s|%s|%s' % (StdCommands.scan_devices, StdScanResponce.change_type, devid,
                                                     POINT.devices[devid]['Type'])
                        message = {
                            'status': 1,
                            StdScanResponce.change_type: {devid: POINT.devices[devid]['Type']}
                        }
                        text_data = [3, None, message, StdCommands.scan_devices]
                        POINT.send(text_data)
                        # CONNECTION.publish(mqtt_topic_answer, message, qos=0)

                    # Робимо перевірки для кожного з типів
                    if POINT.devices[devid]['Type'] == DeviceTypes.rs80mp:
                        # Для пристрою РС80-МР відправляємо назву фідера
                        if mqtt_available:
                            # message = '1|%s|%s|%s|%s' % (StdCommands.scan_devices, StdScanResponce.change_name, devid,
                            #                              POINT.devices[devid]['FidName'])
                            message = {
                                'status': 1,
                                StdScanResponce.change_name: {devid: POINT.devices[devid]['FidName']}
                            }
                            text_data = [3, None, message, StdCommands.scan_devices]
                            POINT.send(text_data)
                            # CONNECTION.publish(mqtt_topic_answer, message, qos=0)
                    if POINT.devices[devid]['Type'] == DeviceTypes.tpm05:
                        # Для пристрою TPM-05 нічого не робимо
                        pass
                    if POINT.devices[devid]['Type'] == DeviceTypes.unknown:
                        # Для не ідентифікованого пристрою нічого не робимо
                        pass
            # =======================================================================================
            else:
                # Якщо пристрій не зареєстрований в конфігу (новий пристрій)
                log_write("Знайдено новий пристрій [%s] [%s]" % (devid, POINT.devices[devid]['Type']))
                if mqtt_available:
                    # message = '1|%s|%s|%s|%s' % (StdCommands.scan_devices, StdScanResponce.new_device, devid,
                    #                              POINT.devices[devid]['Type'])
                    message = {
                        'status': 1,
                        StdScanResponce.new_device: {devid: POINT.devices[devid]['Type']}
                    }
                    text_data = [3, None, message, StdCommands.scan_devices]
                    # CONNECTION.publish(mqtt_topic_answer, message, qos=0)
                if POINT.devices[devid]['Type'] == DeviceTypes.rs80mp:
                    # Для пристрою РС80-МР відправляємо назву фідера
                    if mqtt_available:
                        # message = '1|%s|%s|%s|%s' % (StdCommands.scan_devices, StdScanResponce.change_name, devid,
                        #                              POINT.devices[devid]['FidName'])
                        message = {
                            'status': 1,
                            StdScanResponce.change_name: {devid: POINT.devices[devid]['FidName']}
                        }
                        text_data = [3, None, message, StdCommands.scan_devices]
                        POINT.send(text_data)
                        # CONNECTION.publish(mqtt_topic_answer, message, qos=0)
                if POINT.devices[devid]['Type'] == DeviceTypes.tpm05:
                    # Для пристрою TPM-05 нічого не робимо
                    pass
                if POINT.devices[devid]['Type'] == DeviceTypes.unknown:
                    # Для не ідентифікованого пристрою нічого не робимо
                    pass
        # **************************** Перевіряємо чи всі зареєстровані пристрої відповіли  ****************************
        # log_write('\nКонтроль наявних пристроїв')
        for devid in POINT.configuration['Device']:
            if devid not in POINT.devices:
                old_type = get_config_value2('Device',devid, 'Type')
                old_name = get_config_value2('Device',devid, 'FidName')
                log_write("Зареєстрований пристрій [%s] [%s] [%s]  не відповідає" % (old_type, devid, old_name))
                if mqtt_available:
                    # message = '1|%s|%s|%s|%s' % (StdCommands.scan_devices, StdScanResponce.device_missing, devid,
                    #                              old_type)
                    message = {
                        'status': 1,
                        StdScanResponce.device_missing: {devid: 'old_type'}
                    }
                    text_data = [3, None, message, StdCommands.scan_devices]
                    POINT.send(text_data)
                    # CONNECTION.publish(mqtt_topic_answer, message, qos=0)
    else:
        return False

    log_write('Сканування пристроїв завершено')
    return True


# -----------------------------------------------------------------------------------------------#
#                    Функція ієрархічно виводить пристрої з параметрами в лог
# -----------------------------------------------------------------------------------------------#
def log_devices(title, dict):
    if (title != ''):
        log_write(title)
    for dev in dict:
        log_write('Device %s' % dev)
        for key in dict[dev]:
            log_write('%s%s:%s' % (' ' * 4, key, dict[dev][key]))


# -----------------------------------------------------------------------------------------------#
#   Функція ідентифікує пристрій по розташуванню його номера в структурі modbus та назві         #
#   пристрою, що зберігається в пристрої (якщо вона там зберігається)                            #
# -----------------------------------------------------------------------------------------------#
def device_identification(devid):
    if get_config_value('Identification'):
        for devtype in POINT.configuration['Identification']:
            log_write('-'*25)
            skey = get_config_value2('Identification', devtype,'dev_id_modbus_key')
            if skey is not None:
                keyval = dict(POINT.map).get(skey)
                if keyval is not None:
                    val = int(read_single_values(devid, keyval['address'], keyval['len'], keyval['format'], False))
                    if val == devid:
                        skey = get_config_value2('Identification', devtype, 'dev_name_modbus_key')
                        if skey is not None:
                            sname = get_config_value2('Identification', devtype, 'expected_dev_name')
                            if sname is not None:
                                keyval = dict(POINT.map).get(skey)
                                if keyval is not None:
                                    val = read_single_values(devid, keyval['address'], keyval['len'], keyval['format'], False)
                                    if sname == val:
                                        return devtype
                                else:
                                    log_write('В карті MODBUS відсутній ключ %s, що зазначений у розділі ' +
                                              'Identification файлу конфігурації для типу пристрою %s для ключа ' +
                                              'dev_name_modbus_key' % (skey, devtype))
                else:
                    log_write('В карті MODBUS відсутній ключ %s, що зазначений у розділі Identification файлу ' +
                              'конфігурації для типу пристрою %s для ключа dev_id_modbus_key' % (skey, devtype))
    return DeviceTypes.unknown


# -----------------------------------------------------------------------------------------------#
#   Функція читає назву фідера пристрою та ділитель 3І0 для збереження в глобальному переліку    #
#                       Якщо файл config порушений - поверне None                                #
# -----------------------------------------------------------------------------------------------#
def get_device_stdinfo(devid, key):
    ssrc=''
    res = None
    if key in (1, 2, 3, 4, 5, 6):
        if key == 1:
            skey = 'fider_modbus_key'
            smsg = 'Назва фідера не може бути вичитана з пристрою так як у %s не вказаний ключ %s'
        elif key == 2:
            skey = '3i0div_modbus_key'
            smsg = 'Значення ділителя 3I0 не може бути вичитане з пристрою так як у %і не вказаний ключ %і'
        elif key == 3:
            skey = '3i0min_modbus_key'
            smsg = 'Мінімальне значення струму спрацювання ЗНЗ не може бути вичитане з пристрою так як у %s не '\
                   'вказаний ключ %s'
        elif key == 4:
            skey = '3i0max_modbus_key'
            smsg = 'Максимальне значення струму спрацювання ЗНЗ не може бути вичитане з пристрою так як у %s не '\
                   'вказаний ключ %s'
        elif key == 5:
            skey = 'tpm05_kts_modbus_key'
            smsg = 'Коефіцієнт Ктc не може бути вичитаний з пристрою так як у %s не вказаний ключ %s'
        elif key == 6:
            skey = 'tpm05_ktn_modbus_key'
            smsg = 'Коефіцієнт Ктн не може бути вичитаний з пристрою так як у %s не вказаний ключ %s'

        else:
            smsg = ''
            skey = ''
        skey = get_config_value('Other', skey)
        if skey is not None:                                    # Якщо ключ є в конфігу
            keyval = dict(POINT.map).get(skey)
            if keyval is not None:                                  # Якщо ключ з конфігу є в модбас карті
                res = read_single_values(devid, keyval['address'], keyval['len'], keyval['format'])
            else:                                                   # Якщо ключа з конфігу немає в модбас карті
                ssrc = 'карті MODBUS'
        else:                                                   # Якщо ключа немає в конфігу
            ssrc = 'файлі конфігурації'
        if ssrc != '':
            log_write(smsg % (ssrc, skey))
    else:
        log_write("Якщо це повідомлення з'явилося - значить програміст ідіот")
    return res


# -----------------------------------------------------------------------------------------------#
#                     Виніс читання MODBUS з try-except в окрему функцію.                        #
#  Вертає кортеж або None у випадку помилки. Виводить текст тільки при помилці                   #
# -----------------------------------------------------------------------------------------------#
def modbus_read_ex(devid, addr, xcount, bsil=False):
    if not wait_for_port(): return None                                     # Якщо під час очікування порт зник або виникла інша критична помилка
    try:
        xval = POINT.modbus_master.execute(devid, cst.READ_HOLDING_REGISTERS, addr, xcount)
        return xval
    except modbus_tk.modbus.ModbusError as exc:
        if not bsil:
            log_write('Пристій [%s] не може виконати команду. Помилка MODBUS: [%s]' %
                      (devid, str(exc)))
        return None
    except modbus_tk.exceptions.ModbusInvalidResponseError as exc:
        if not bsil:
            log_write('Пристрій [%s] не відповідає. Помилка MODBUS: [%s]' % (devid, str(exc)))
            return None
    except Exception as e:
        print(e)
    finally:
        POINT.serial_port.close()



# -----------------------------------------------------------------------------------------------#
#  Функція зчитування з пристрою групи 16-ти бітних (Holding) регістрів з подальшою              #
#  інтерпретацією їх відповідно до формату. Вертає значення або None                             #
# -----------------------------------------------------------------------------------------------#
def read_single_values(devid, addr, xcount, sformat, withbuffer = True):
    if type(devid) != int: devid = int(devid)
    if type(addr) != int: addr = int(addr, 0)
    if type(xcount) != int: xcount = int(xcount)
    if type(sformat) != str: xcount = str(sformat)

    if withbuffer:
        values = buffer_ex(devid, addr)                 # Намагаємося взчти значення із буфера
        if  values is not None: return values           # Якщо значення є - вертаємо його

    log_write('Читаємо [%s] регістрів з адреси [%s] пристрою № [%s]' % (xcount, hex_ex(addr), devid))
    # Пише тільки при помилці. Вертає кортеж або None
    values = modbus_read_ex(devid, addr, xcount)
    log_write('Значення зчитане: ' + str(values))
    if values:
        log_write('Зчитане значення: [%s], перетворюємо відповідно формату [%s] ' % (str(values), sformat))
        values = convert_registers_by_format(values, devid, sformat)
        log_write('Зчитане результуюче значення: [%s]' % values)
        buffer_ex(devid, addr, values)
    else:
        log_write('Пристрій прочитати не вдалося')
    return values


# -----------------------------------------------------------------------------------------------#
#           Функція виконує інтерпретацію зчитаного значення відповідно до формату               #
#          В якості value у фунцію завжи потрапляє кортеж. Вертає значення або None              #
# -----------------------------------------------------------------------------------------------#
def convert_registers_by_format(values, devid, sformat=''):
    if sformat == '':
        # Модифікація не портібна
        if len(values) == 1:
            values = values[0]
        sres = str(values)
    else:
        sbase = str(sformat[0:3:1])
        sadd = str(sformat[3:6:1])

        # Для групових форматів: текст, заводський номер, дата
        if len(values) > 1:
            # Текстовий формат (довільна кількість регістрів)
            if sbase == "STR":
                sres = convert_list_to_string(values)

            # Заводський номер пристрою (2 регістри)
            elif sbase == "SER":
                if len(values) == 2:
                    f1 = val_to_strlen
                    xmy = explode_reg_to_bytes(values[1])
                    sres = f1(values[0], 3) + f1(xmy[0], 2) + f1(xmy[1], 2)
                else:
                    log_write('При зчитуванні заводського номеру отримано ' + str(len(values)) +
                              ' регістрів замість 2\nПеревірте значення поля "довжина" ключа ' +
                              '"SERIAL" в файлі карти MODBUS')
                    sres = None

            # Дата - час
            elif sbase == "DTT":
                if len(values) >= 3:
                    ym = explode_reg_to_bytes(values[0])
                    dh = explode_reg_to_bytes(values[1])
                    ms = explode_reg_to_bytes(values[2])
                    func = val_to_strlen
                    sres = (func(dh[0], 2) + '.' + func(ym[1], 2) + '.20' + func(ym[0], 2) + ' ' +
                            func(dh[1], 2) + ':' + func(ms[0], 2) + ':' + func(ms[1], 2))
                    # Якщо є ще й 4-й регістр - Додаєио десятки мілісекунд до часу
                    if len(values) > 3:
                        dms = explode_reg_to_bytes(values[3])
                        sres = sres + ' ' + func(dms[0] * 10, 3)
                else:
                    log_write('При зчитуванні дати-часу отримано [%s] регістрів, що менше мінімальної '
                              'кількості в 3 регістри\nПеревірте значення поля "довжина" форматів '
                              '[%s] в файлі карти MODBUS' % (len(values), sformat))
                    sres = None
            # Специфічнв багатобайтовы числові формати пристрою ТРМ05
            elif sbase == 'NUM':
                # 32-х бітне число
                if sadd == '32B':
                    sres = str(values[0] * 65536 + values[1])
                else:
                    log_write('Не передбачений числовий формат [%s] для багаторегістрових значень' % sformat)
                    sres = None
            else:
                log_write('Не коректний формат [%s] або використання формату для багаторегістрових значень' % sformat)
                sres = None

        # Для однорегістрових форматів (Число, виборка, бітовий формат)
        elif len(values) == 1:
            values = values[0]
            # Якщо читається число
            if sbase == "NUM":
                if sadd.isdigit():
                    sres = convert_reg_to_strfloat(values, int(sadd))
                elif sadd == '3I0':
                    sres = convert_reg_to_strfloat(values, POINT.devices[str(devid)]['Div3I0'])
                # Для номеру дискретного входу
                elif sadd == 'XDI':
                    if (values >= 0) and (values < 5):
                        sres = 'p' + str(values)
                    elif (values > 100) and (values < 105):
                        sres = 'i' + str(values - 100)
                    else:
                        log_write('При зчитуванні номеру дискретного входу отримано не допустиме значення [%s] '
                                  '\nДопустимі значення: [0,1,2,3,4,101,102,103,104]\nПеревірте адресу '
                                  'відповідного ключа в файлі карти MODBUS та сам пристрій' % str(values))
                        sres = None
                # Якщо треба не ділити а множити
                elif sadd[0:2] == '1E':
                    if str(sadd[-1]).isdigit():
                        sadd = '1' + '0' * int(sadd[-1])
                        sres = str(values * int(sadd))
                    else:
                        log_write('Не коректний числовий формат [%s]\nПеревірте формат відповідного ключа '
                                  'в файлі карти MODBUS.' % sformat)
                        sres = None
                elif sadd == 'SIG':
                    # Рахую, що знак знаходиться у стпршому біті
                    strbin = list(convert_reg_to_strbin(values))
                    ssign = '-' if strbin[15] == '1' else ''
                    strbin[15] = '0'
                    strbin = ''.join(strbin)
                    values = convert_strbin_to_reg(strbin)
                    sres = ssign + convert_reg_to_strfloat(values, 1000)
                elif sadd == '^-3':
                    sres = convert_reg_to_strfloat(values, 1000)
                else:
                    log_write('Не коректний числовий формат [%s]\nПеревірте формат відповідного ключа '
                              'в файлі карти MODBUS.' % sformat)
                    sres = None
            # Виборка з заздалегідь визначених значень
            elif sbase == "CAS":
                if sadd == 'E08':
                    dcodes = {'0': Speeds.speed00, '1': Speeds.speed01, '2': Speeds.speed02,
                              '3': Speeds.speed03, '4': Speeds.speed04, '5': Speeds.speed05,
                              '6': Speeds.speed06, '7': Speeds.speed07, '8': Speeds.speed08,
                              '9': Speeds.speed09, '10': Speeds.speed10}
                elif sadd == 'E20':
                    dcodes = {'0': CrashCode.nocrash,
                              '1': CrashCode.msz1, '2': CrashCode.sv1, '3': CrashCode.sv2, '4': CrashCode.msz2,
                              '5': CrashCode.znz1, '6': CrashCode.znz2,
                              '16': CrashCode.apv1_work, '17': CrashCode.apv1_no_inclusion,
                              '18': CrashCode.apv1_fail, '19': CrashCode.apv1_succ,
                              '20': CrashCode.apv2_work, '21': CrashCode.apv2_no_inclusion,
                              '22': CrashCode.apv2_fail, '23': CrashCode.apv2_succ,
                              '24': CrashCode.chapv_work, '25': CrashCode.chapv_no_inclusion,
                              '26': CrashCode.chapv_fail, '27': CrashCode.chapv_succ,
                              '33': CrashCode.achr, '140': CrashCode.ext_protect,
                              '160': CrashCode.resource_over}
                elif sadd == 'E03':
                    dcodes = {'0': FeaturesRele.independent, '1': FeaturesRele.norm_dependent,
                              '2': FeaturesRele.very_dependent, '3': FeaturesRele.analog_rtv1,
                              '4': FeaturesRele.analog_rt80}
                else:
                    dcodes = {}
                skey = str(values)
                if dcodes.get(skey) is not None:
                    sres = dcodes[skey]
                else:
                    log_write('Не коректний формат виборки [%s]\nПеревірте формат відповідного ключа '
                              'в файлі карти MODBUS.' % sformat)
                    sres = None
            # Для всіх бітових форматів
            elif sbase == "BIT":
                # Кількість біт в результаті для кожного із форматів
                dusedbits = {'010': 8, '011': 4, '012': 8, '013': 7, '014': 14,
                             '015': 4, '017': 15, '17A': 4, '018': 16, '18A': 16,
                             '021': 2, '024': 16, '24A': 16, '027': 14, '028': 14,
                             '029': 7, '030': 8}
                if sadd in dusedbits:
                    sval = ''
                    sres = convert_reg_to_strbin(values, dusedbits[sadd])

                    # не бітовий формат вертається для:
                    if sadd == '014':
                        # на сквітованих подій
                        kvit = (CrashCode.msz1, CrashCode.sv1, CrashCode.sv2, CrashCode.msz2,
                                CrashCode.znz1, CrashCode.znz2, '-', '-', CrashCode.apv1_work,
                                CrashCode.apv2_work, '-', '-', CrashCode.ext_protect, CrashCode.achr)
                        sres = get_crash_list(sres, kvit)
                    # Формат режиму роботи  VD: біти 0-13 значущі, але значення кодується 2-ма бітами
                    elif sadd == '027':
                        for xpos in range(0, 13, 2):
                            xbit = int(extract_bits_block(sres, xpos, 2))
                            if xbit in (0, 1):
                                sval = str(xbit) + sval
                            else:
                                log_write('При зчитуванні з пристрою [%s] бітового формату [%s] отримано не допустиме '
                                          'значення [%s] регістру, так як пари біт 10 та 11 не передбачені '
                                          'виробником пристрою. Можливо пристрій вийшов з ладу' % (devid, sadd, sres))
                                sval = None
                                break
                        sres = sval
                    # повідомлення про пуск або роботу ступенів захисту (тут не відомо то пуск чи робота)
                    elif sadd == '028':
                        dcrash = (CrashCode.msz1, CrashCode.sv1, CrashCode.sv2, CrashCode.msz2,
                                  CrashCode.znz1, CrashCode.znz2, '-', '-', '-', '-', '-', '-',
                                  CrashCode.ext_protect, CrashCode.achr)
                        sres = get_crash_list(sres, dcrash)
                        # Формат стану ВВ: біт 7 значущий
                    elif sadd == '030':
                        sres = extract_bits_block(sres, 7, 1)
                else:
                    log_write('Не коректний бітовий формат [%s]\nПеревірте формат відповідного ключа '
                              'в файлі карти MODBUS.' % sadd)
                    sres = None

            else:
                log_write('Не коректний формат [%s] або використання формату для однорегістрових значень' % sformat)
                sres = None
        # Надійшов порожній кортеж
        else:
            log_write('Для інтерпретації не передані дані.')
            sres = None
    return sres


# ----------------------------------------------------------------------------------------------#
# Функція перетворює виборочний формат Ф20 та бітові формати  Ф14 та Ф28 з бітового вигляду в   #
# перелік назв збудників. crasgnames - кортеж назв, який по довжині дорівнює довжині strbin     #
# ----------------------------------------------------------------------------------------------#
def get_crash_list(strbin, crasgnames):
    strbin = strbin[::-1]
    xpos = 0
    sres = ''
    for sbit in strbin:
        if sbit == '1':
            sres = sres + '|' + crasgnames[xpos]
        xpos = xpos + 1
    if sres != '':
        sres = sres[1:len(sres):1]
    return sres


# ======================= Блок функцій роботи з протоколм MQTT =================================#
# ----------------------------------------------------------------------------------------------#
#        Функція, виконується при успішному з'єднанні Rasberry з MQTT сервісом (брокером)       #
# ----------------------------------------------------------------------------------------------#
def mqtt_on_connect(xmqclient, userdata, flags, rc):
    if str(xmqclient) + str(userdata) + str(flags) == '*':
        log_write('  ')
    topic = get_config_value('mqttServer', 'request_topic')
    if rc == 0:
        CONNECTION.subscribe(topic, qos=0)
        log_write('Підписка на топік %s успішна' % topic)
    else:
        if rc < 6:
            rcinfo = {
                "1": "Не коректна версія протоколу",
                "2": "Не вірний ідентифікатор клієнта",
                "3": "Сервер не доступний",
                "4": "І'мя користувача або пароль не вірні",
                "5": "Не аторизований"
            }
            serr = rcinfo[str(rc)]
        else:
            serr = "Помилка з'єднання"
        log_write('Під час підписки на топік %s виникла помилка "%s". Код помилки: %s. Підписка не успішна"' %
                  (topic, serr, rc))

# ----------------------------------------------------------------------------------------------#
# Функція, виконується при появі повідомлення у раніше підписаному топіку на дошці MQTT брокера #
# Повідомлення надходить у вигляді строки, наприклад "1|get|Author|DevSpeed
# Перевіряється коректність запиту і ключа
# ----------------------------------------------------------------------------------------------#
def mqtt_on_message(xmqclient, userdata, message):
    if str(xmqclient) + str(userdata) == '*':
        log_write('Просто щоб використати змінні')
    if os_is_linux():
        message = message.payload.decode('UTF-8')
    log_write('\nОтримано повідомлення [%s]' % message)
    if(DAEMON.isAlive()):
        POINT._requests.append(message)


def on_message(ws, message):
    print(message)
    message = json.loads(message)
    print(message)
    if (POINT.listen_requests.isAlive()):
        print('ok')
        POINT._requests.append(message)
    else:
        print('error')


# -----------------------------------------------------------------------------------------------#
#   Функція забезпечує отримання актуальних даних з проміжного буфера та запис в нього           #
# -----------------------------------------------------------------------------------------------#
def buffer_ex(devid, addr, value=None):
    devid = str(devid)
    addr = hex_ex(addr)
    if value is None:
        if devid in POINT.buffer:
            if addr in POINT.buffer[devid]:
                time0 = POINT.buffer[devid][addr]['time']
                relevance_time = get_config_value('Other', 'relevance_time')
                if relevance_time is not None:
                    if (time0 + relevance_time) >= time.time():
                        log_write('Для пристрою [%s] дані [%s] з адреси [%s] актуальні. Зчитування не здійснюється' %
                                  (devid, POINT.buffer[devid][addr]['value'], addr))
                        return POINT.buffer[devid][addr]['value']
                    else:
                        del POINT.buffer[devid][addr]
    else:
        if devid not in POINT.buffer:
            POINT.buffer[devid] = {}
        POINT.buffer[devid][addr] = {'value': value, 'time': time.time()}
    return None


# ======================== Блок функцій для запису в пристрій ===================================#
# -----------------------------------------------------------------------------------------------#
#                  Функція перетворює float число та float строку в значення регістру            #
# -----------------------------------------------------------------------------------------------#
def convert_float_to_reg(value, divider):
    res = None
    if divider in (1, 10, 100, 1000):
        res = int(float(value) * divider)
    else:
        log_write('Не вірний ділитель [%s]' % divider)
    return res


# -----------------------------------------------------------------------------------------------#
#  Функція записує в пристрій один регістр. Говорить тільки при помилці. Вертає True або False   #
# -----------------------------------------------------------------------------------------------#
def modbus_write_ex(devid, addr, value, cmd='register'):
    if not wait_for_port(): return False  # Якщо під час очікування порт зник або виникла інша критична помилка
    cmd = cst.WRITE_SINGLE_REGISTER if cmd == 'register' else cst.WRITE_SINGLE_COIL
    try:
        POINT.modbus_master.execute(devid, cmd, addr, output_value=value)
        return True
    except modbus_tk.modbus.ModbusError as exc:
        log_write('Пристій [%s] не може виконати команду. Помилка MODBUS: [%s]' %
                  (devid, str(exc)))
        return False
    except Exception as e:
        print(e)
    finally:
        POINT.serial_port.close()


# -----------------------------------------------------------------------------------------------#
#                       Функція записує в пристрій текст з контролем запису                      #
# -----------------------------------------------------------------------------------------------#
def write_string_format(devid, addr, sval, xcount, sformat):
    log_write('Запис тексту [%s] в пристрій [%s] в адресу [%s] дожиною [%s] регістрів' %
              (sval, devid, hex_ex(addr), xcount))
    xaddr = addr
    if len(sval) > (xcount * 2):
        log_write('Назва [%s] буде обрізана до %s символів' % (sval, xcount * 2))
        sval = sval[0:xcount * 2:1]
    log_write('Текст для запису: [%s]' % sval)
    regs = convert_string_to_list(sval)
    # Записувати будемо всі регістри назви. Не використані - обнуляємо
    if len(regs) < xcount:
        for xReg in range(xcount - len(regs)):
            regs.append(0)
    log_write('Регістри для запису: %s' % str(regs))
    bsucc = False
    for xReg in regs:
        bsucc = modbus_write_ex(devid, xaddr, xReg)
        s = ('' if bsucc else 'не')+' успішний'
        log_write('Запис значення %s в адресу %s - %s' % (xReg, hex_ex(xaddr), s))
        if not bsucc:
            break
        xaddr = xaddr + 1
    if bsucc:
        bsucc = False
        sread = read_single_values(devid, addr, xcount, sformat, False)
        if sread is not None:
            bsucc = sread == sval
            s = ('' if bsucc else 'не') + ' успішний'
            log_write('Записане значення: [%s], зчитане значення: [%s], запис: %s' % (sval, sread, s))
    log_write('Завершення запису в пристрій тексту')
    return bsucc


# -----------------------------------------------------------------------------------------------#
#                       Функція записує в пристрій число з контролем запису                      #
# -----------------------------------------------------------------------------------------------#
def write_single_register(devid, addr, xval):
    log_write('Запис значення [%s] в адресу [%s] пристрою [%s]' % (xval, hex_ex(addr), devid))
    bsucc = modbus_write_ex(devid, addr, xval)
    if bsucc:
        bsucc = False
        xread = read_single_values(devid, addr, 1, '', False)
        if xread is not None:
            bsucc = int(xval) == int(xread)
            s = ('' if bsucc else 'не') + ' успішний'
            log_write('Записане значення: [%s], зчитане значення: [%s], запис: %s' % (xval, xread, s))
    return bsucc


# ----------------------------------------------------------------------------------------------#
# Функція перевіряє, чи змінна містить число, бо str.isnumeric() не робить як треба, і до сраки #
#                   При onlyint - вертає True, тільки якщо число ціле                           #
# ----------------------------------------------------------------------------------------------#
def is_numeric(snum, onlyint=False):
    try:
        a = float(snum)
        if onlyint:
            return (a - int(a)) == 0
        else:
            return True
    except ValueError:
        return False
    except Exception as e:
        print(e)


# ----------------------------------------------------------------------------------------------#
#             Функція перетворює строку номера пристрою з ознакою інверсії в значення регістру  #
#            Номер входу без інверсії може бути вказаний цифрою без префікса 'p' чи 'i'         #
#                       На вході відомо, що значення є і воно перевірене                        #
# ----------------------------------------------------------------------------------------------#
def convert_dinumber_to_reg(values):
    values = str(values)
    if values[0].isdigit():
        inv = 0
    else:
        inv = 0 if values[0] == 'p' else 100
        values = values[1:len(values):1]
    values = int(values)
    if values > 0:
        values = values + inv
    return values


# -----------------------------------------------------------------------------------------------#
#  Функція перевіряє аргумент та в залежності від аргументу передає управління йункціям запису   #
#  одного біта регістра або ж цілого регістра                                                    #
#  Якщо команда надійшла з форми налаштування KL, VD - коректний аргумент буде виглядати '011011'#
#  Якщо команда надійшла з форми захистів  - коректний аргумент буде виглядати '{Джерело:1}'     #
# -----------------------------------------------------------------------------------------------#
def write_binary_format(devid, addr, sval, sformat):
    log_write('Аналізуємо бітовий аргумент [%s]' % sval)
    sval = str(sval).strip()
    bsucc = False

    # Буде запис одного біта якщо sval='{Джерело:1}'
    if sval.startswith('{') and sval.endswith('}'):
        sval = sval[1:len(sval)-1:1]
        sa = sval.split(':')
        if len(sa) > 1:
            # Формат вірний, якщо значення біта 1 або 0 і код джерела існує
            if (sa[1] in ('0', '1')) and (len(sa[0]) > 0):
                bsucc = write_binary_format_as_bit(devid, addr, sa[0], sa[1], sformat)
            else:
                log_write('Формат аргумента [%s] для запису значення [%s] біта не коректний' % (sval, sa[1]))
        else:
            log_write('Формат аргумента [%s] для запису біта не містить джерела та/або значення' % sval)

    # Буде запис цілого побітового значення регістру якщо 0111010010
    else:
        bsucc = write_binary_format_as_reg(devid, addr, sval, sformat)
    return bsucc


# -----------------------------------------------------------------------------------------------#
#                Функція записує в пристрій значення одного біту інформації                      #
# -----------------------------------------------------------------------------------------------#
# Формат повідомлення: 1|setbit|Key|{МСЗ1:1}                                                     #
# В цьому випадку буде надіслание джерело та значення біта (0/1)                                 #
#    1. Зчитати цілий регістр параметру            2. Захист (джерело) перетворити в номер біта  #
#    3. Перевірити, чи цільовий біт змінюється     4. Якщо так - то замінити біт в регістрі      #
#    5. Записати регістр з перевіркою                                                            #
# -----------------------------------------------------------------------------------------------#
def write_binary_format_as_bit(devid, addr, ssource, sbitval, sformat):
    log_write('Запис значення [%s] для джерела [%s] в адресу [%s] пристрою [%s]' %
              (sbitval, ssource, hex_ex(addr), devid))

    sadd = sformat[3:6:1]
    bsucc = True
    # Формат пуску джерела пуску осцилографа від захистів : 0-5, 8-15 біти значущі
    if sadd == '017':
        dsrc = {Sources.msz1_pusk: 0, Sources.sv1_pusk: 1, Sources.sv2_pusk: 2,
                Sources.znz1_pusk: 3, Sources.znz2_pusk: 4, Sources.msz2_pusk: 5,
                Sources.msz1_work: 8, Sources.sv1_work: 9, Sources.sv2_work: 10,
                Sources.znz1_work: 11, Sources.zz_work: 12, Sources.znz2_work: 13,
                Sources.msz2_work: 14}

    # Формат пуску джерела пуску осцилографа по входах : 0-3 біти значущі
    elif sadd == '17A':
        dsrc = {Sources.di1_dir: 0, Sources.di2_dir: 1,
                Sources.di3_dir: 2, Sources.di4_dir: 3}

    # Формат призначення сигналів для KL-1-3: біти 0-1,6-14 значущі
    elif sadd == '018':
        dsrc = {Sources.msz1_pusk: 0, Sources.msz2_pusk: 1, Sources.znz2_work: 6,
                Sources.msz2_work: 7, Sources.msz1_work: 8, Sources.sv1_work: 9,
                Sources.sv2_work: 10, Sources.znz1_work: 11, Sources.zz_work: 12,
                Sources.achr_work: 13, Sources.apv_work: 14, Sources.vv_ended: 15}

    # Формат призначення сигналів для KL-4 та ДШ: біти 6-13 значущі
    elif sadd == '18A':
        dsrc = {Sources.znz2_work: 6, Sources.msz2_work: 7, Sources.msz1_work: 8,
                Sources.sv1_work: 9, Sources.sv2_work: 10, Sources.znz1_work: 11,
                Sources.zz_work: 12, Sources.achr_work: 13, Sources.vv_ended: 15}

    # Формат скидання для KL-4 : біти 0-1 значущі
    elif sadd == '021':
        dsrc = {Sources.reset_bkv: 0, Sources.reset_kvit: 1}

    # Формат призначення сигналів для включення VD від захистів: біти 0-1, 5-14 значущі
    elif sadd == '024':
        dsrc = {Sources.msz1_pusk: 0, Sources.msz2_pusk: 1, Sources.znz2_work: 5,
                Sources.apv_ready: 6, Sources.msz2_work: 7, Sources.msz1_work: 8,
                Sources.sv1_work: 9, Sources.sv2_work: 10, Sources.znz1_work: 11,
                Sources.zz_work: 12, Sources.achr_work: 13, Sources.apv_work: 14,
                Sources.vv_ended: 15}

        # Формат призначення сигналів для включення VD від входів DI: біти 0-3,8-11 значущі
    elif sadd == '24A':
        dsrc = {Sources.di1_dir: 0, Sources.di2_dir: 1, Sources.di3_dir: 2,
                Sources.di4_dir: 3, Sources.di1_inv: 8, Sources.di2_inv: 9,
                Sources.di3_inv: 10, Sources.di4_inv: 11}

    # Формат обліку ресурсу ВВ: біти 0-6 значущі
    elif sadd == '029':
        dsrc = {Sources.msz1_work: 0, Sources.msz2_work: 1, Sources.sv1_work: 2,
                Sources.sv2_work: 3, Sources.znz1_work: 4, Sources.znz2_work: 5,
                Sources.zz_work: 6}
    else:
        log_write('Вказаний не коректний побітовий формат формат [%s]' % sformat)
        dsrc = {}
        bsucc = False

    # Якщо формат вказано вірно - читаємо регістр, замінюємо біт та записуємо назад
    if bsucc:
        bsucc = False
        if ssource in dsrc:
            xbit = int(dsrc[ssource])
            # Вертає побітне значення або NONE
            strbin = read_single_values(devid, addr, 1, sformat)
            if strbin is not None:
                truebit = get_bit(strbin, xbit)
                log_write('Існуюче значення біту=[%s], Нове значення біту=[%s]' % (truebit, sbitval))
                if truebit != sbitval:
                    strbin = set_bit(strbin, xbit, sbitval)
                    xreg = convert_strbin_to_reg(strbin)
                    if xreg is not None:
                        if (sadd == '021') and (xreg == 0):
                            log_write('Відключення обох сигналів на скидання KL-4 заборонено')
                        else:
                            bsucc = write_single_register(devid, addr, xreg)
                else:
                    log_write('Запис біту [%s] не здійснюється так як для запису надано '
                              'існуюче значення [%s]' % (xbit, sbitval))
        else:
            log_write('Бітовим форматом [%s] не передбачено джерело [%s]' % (sadd, ssource))
    return bsucc


# -----------------------------------------------------------------------------------------------#
#                Функція записує в пристрій бітове значення передане цілим регістром             #
# -----------------------------------------------------------------------------------------------#
#          Формат повідомлення: '1|set|Key|'001101101010'
#          Перетворити в int, накласти маску значущих біт та записати з перевіркою
# -----------------------------------------------------------------------------------------------#
def write_binary_format_as_reg(devid, addr, sval, sformat):
    log_write('Перетворюємо бітове значення [%s] в значення регістру:' % sval)
    xreg = convert_strbin_to_reg(sval)
    bsucc = False
    if xreg is not None:
        sadd = sformat[3:6:1]
        dmasks = {'017': '0111111100111111', '17A': '0000000000001111', '018': '1111111111000011',
                  '18A': '1011111111000000', '021': '0000000000000011', '024': '1111111111100011',
                  '24A': '0000111100001111', '029': '0000000001111111'}
        if sadd in dmasks:
            xmask = convert_strbin_to_reg(dmasks[sadd])
            xreg = xreg & xmask
            if (sadd == '021') and (xreg == 0):
                log_write('Відключення обох сигналів на скидання KL-4 заборонено')
            else:
                bsucc = write_single_register(devid, addr, xreg)
        else:
            log_write('Вказаний не коректний бітовий формат [%s]' % sformat)
    else:
        log_write('Запис в пристрій не здійснюється')
    return bsucc


# -----------------------------------------------------------------------------------------------#
#          Функція перевіряє коректність отрианого значення лоя всіх числових форматів           #
#                                sformat - тут три останні символи формату                       #
# -----------------------------------------------------------------------------------------------#
def check_range_numbers(devid, skey, sformat, value):
    bsucc_di = True
    if sformat == '3I0':
        xmin = POINT.devices[str(devid)]['Min3I0']
        xmax = POINT.devices[str(devid)]['Max3I0']
        xstep = 1 / POINT.devices[str(devid)]['Div3I0']
    else:
        xmin = POINT.map[skey]['min']
        xmax = POINT.map[skey]['max']
        xstep = POINT.map[skey]['step']

    # ----- Для дискретних входів додаткова перевірка індекса та напрямку ----- #
    if sformat == 'XDI':
        value = str(value)
        # Ознака допустимості інверсного сигналу
        inverse = POINT.map[skey]['inverse']
        # Якщо вказаний напрямок (для прямого сигналу він може не вказуватися
        inv = False
        if not value[0].isdigit():
            if value[0] in ('i', 'p'):
                inv = value[0] == 'i'
            else:
                log_write('Не коректне значення напрямку [%s] дискретного входу [%s]' %
                          (value[0], value[1:len(value):1]))
                bsucc_di = False
            value = value[1:len(value):1]
        if (inverse == 0) and inv:
            log_write('Для ключа [%s] не передбачено використання інверсії сигналу на вході пристрою' % skey)
            bsucc_di = False

    bsucc_num = False
    if is_numeric(value):
        value = float(value)
        if (value >= xmin) and (value <= xmax):
            if xstep in (0.001, 0.01, 0.1, 1, 10, 100):
                if xstep < 1:
                    ystep = len(str(int(1/xstep)))-1
                    smod = str(value).split('.')
                    bsucc_num = len(smod[1]) <= ystep
                elif xstep > 1:
                    chkval = int(value / xstep) * xstep
                    bsucc_num = value == chkval
                else:
                    bsucc_num = is_numeric(value, True)
                if not bsucc_num:
                    if is_numeric(value, True):
                        value = int(value)
                    log_write('Значення [%s] не кратне кроку [%s] значень, дозволеному для ключа [%s]' %
                              (value, xstep, skey))
            else:
                log_write('Крок [%s] зміни значення не коректний ' % xstep)
        else:
            if is_numeric(value, True):
                value = int(value)
            log_write('Значення [%s] знаходиться поза меж [%s - %s] значень, дозволених для ключа [%s]' %
                      (value, xmin, xmax, skey))
    else:
        log_write('Значення [%s] не числове' % value)
    return bsucc_num and bsucc_di


# -----------------------------------------------------------------------------------------------#
#                     Функція записує в пристрій числове значення                                #
# -----------------------------------------------------------------------------------------------#
def write_numeric_format(devid, addr, sval, sformat, skey):
    sadd = sformat[3:6:1]
    xreg = None

    if check_range_numbers(devid, skey, sadd, sval):
        if sadd.isdigit():
            xreg = convert_float_to_reg(sval, int(sadd))

        elif sadd == '3I0':
            xreg = convert_float_to_reg(sval, POINT.devices[str(devid)]['Div3I0'])

        elif sadd == 'XDI':
            xreg = convert_dinumber_to_reg(sval)

        elif sadd[0:2] == '1E':
            sadd = '1' + '0' * int(sadd[-1])
            xreg = int(int(sval) / int(sadd))
        else:
            log_write('Не вірний числовий формат [%s] ' % sformat)
    if xreg is not None:
        bsucc = write_single_register(devid, addr, xreg)
    else:
        log_write('Запис значення [%s] не здійснюється' % str(sval))
        bsucc = False
    return bsucc


# -----------------------------------------------------------------------------------------------#
#                       Функція перевіряє, чи утворюють день, місяць та рік коректну дату        #
# -----------------------------------------------------------------------------------------------#
def check_date(day, month, year):
    sdate = '%s/%s/%s' % (month, day, year)
    try:
        date = time.strptime(sdate, '%m/%d/%Y')
        # Ця тупість, щоб використати змінну і прибрати попередження
        if date == '---':
            log_write('---')
        return True
    except ValueError:
        return False
    except Exception as e:
        print(e)


# -----------------------------------------------------------------------------------------------#
#                       Функція записує в пристрій дату та час з контролем запису.               #
#   Значення sVal в форматі {DD.MM.YYYY hh:mm:ss} десятки мілісекунд не пишуться, бо то тупо     #
# -----------------------------------------------------------------------------------------------#
def write_datetime_format(devid, addr, sval):
    log_write('Запис дати і часу [%s] в пристрій [%s]' % (sval, devid))
    xaddr = addr

    origval = sval
    sval = str(sval).strip()
    bsucc = sval.startswith('{') and sval.endswith('}')
    if bsucc:
        sa = sval[1:len(sval) - 1:1].replace('.', ' ').replace(':', ' ').split(' ')
        # Чи вистачає частин
        bsucc = len(sa) == 6
        if bsucc:
            # Перетворюємо на список чисел, контролюючи присутність тільки цілих чисел
            xpos = 0
            while xpos < len(sa):
                if is_numeric(sa[xpos], True):
                    sa[xpos] = int(sa[xpos])
                else:
                    bsucc = False
                    break
                xpos = xpos + 1
            # Якщо дата-час складається виключно з цілих чисел
            if bsucc:
                bsucc = check_date(sa[0], sa[1], sa[2])
                if bsucc:
                    if (int(sa[3]) < 0) or (int(sa[3]) > 23):
                        log_write('Години [%s] вказані не корекктно.' % sa[3])
                        bsucc = False
                    if (int(sa[4]) < 0) or (int(sa[4]) > 59):
                        log_write('Хвилини [%s] вказані не корекктно.' % sa[4])
                        bsucc = False
                    if (int(sa[5]) < 0) or (int(sa[5]) > 59):
                        log_write('Секунди [%s] вказані не корекктно.' % sa[5])
                        bsucc = False
                    # Якщо дата та час коректні
                    if bsucc:
                        # Із року писати будемо тільки десятки, бо пристрій їх інтерпретує як 20хх
                        sa[2] = int(round((sa[2] / 100 - int(sa[2] / 100)) * 100))
                        xregs = (sa[2] * 256 + sa[1], sa[0] * 256 + sa[3], sa[4] * 256 + sa[5])
                        log_write('Значення для запису: [%s]\nРегістри для запису: [%s]' % (str(sa), str(xregs)))
                        # ------Безпосередньо послідовний запис -----------
                        for xpos in xregs:
                            bsucc = modbus_write_ex(devid, xaddr, xpos)
                            s = ('' if bsucc else 'не') + ' успішний'
                            log_write('Запис значення %s в адресу %s - %s' % (xpos, hex_ex(xaddr), s))
                            if not bsucc:
                                break
                            xaddr += 1
                        # ------ Перевіряти записаний час читанням тупо, так як він зміниться -----------
                        # ------ Крім того шороковіщательна команда встанвлення часу взагалі ек передбачає перевірки
                else:
                    log_write('Вказана не коректна дата [%s.%s.%s]' %
                              (val_to_strlen(sa[0], 2), val_to_strlen(sa[1], 2), val_to_strlen(sa[2], 2)))
            else:
                log_write('Значення параметру дати-часу [%s] не коректне' % origval)
        else:
            log_write('Значення параметру дати-часу [%s] не коректне' % origval)
    else:
        log_write('Значення параметру дати-часу [%s] не коректне' % origval)
    return bsucc


# -----------------------------------------------------------------------------------------------#
#       Функція записує фактично тільки характеристике реле для МСЗ з контролем запису.          #
#         Вертає ознаку успіху. Винесено в окрему функцію - щоб було як решта форматів           #
# -----------------------------------------------------------------------------------------------#
def write_case_format(devid, addr, sval, sformat):
    sadd = sformat[3:6:1]
    bsucc = False
    if sadd == 'E03':
        dval = {FeaturesRele.independent: 0, FeaturesRele.norm_dependent: 1,
                FeaturesRele.very_dependent: 2, FeaturesRele.analog_rtv1: 3,
                FeaturesRele.analog_rt80: 4}
        if sval in dval:
            bsucc = write_single_register(devid, addr, dval[sval])
        else:
            log_write('Не коректне значення [%s] характеристики реле' % sval)
    else:
        log_write('Не вірний формат виборки [%s] ' % sformat)
    return bsucc


# -----------------------------------------------------------------------------------------------#
#           Функція записує значення в пристрій з контролем запису. Вертає ознаку успіху         #
# values - може бути текст, ціле або дробне число, вираз номеру входу, бітове значення регістру, #
# значення одного біта в регістрі, тому тут попередня перевірка не можлива                       #
# -----------------------------------------------------------------------------------------------#
def write_single_values(devid, addr, values, xcount, sformat, skey):
    sbase = sformat[0:3:1]

    if sbase == 'STR':
        bsucc = write_string_format(devid, addr, str(values), xcount, sformat)
    elif sbase == 'NUM':
        bsucc = write_numeric_format(devid, addr, values, sformat, skey)
    elif sbase == 'BIT':
        bsucc = write_binary_format(devid, addr, values, sformat)
    elif sbase == 'DTT':
        bsucc = write_datetime_format(devid, addr, values)
    elif sbase == 'CAS':
        bsucc = write_case_format(devid, addr, values, sformat)
    else:
        log_write('Запис не здійснюється так як вказаний не коректний формат [%s]' % sformat)
        bsucc = False
    return bsucc


# -----------------------------------------------------------------------------------------------#
#   Функція записує в пристрій команду телеуправління без контролю запису. Команда - то 1 або 0  #
# -----------------------------------------------------------------------------------------------#
def write_telecontrol(devid, addr, sval, skey, sformat):
    log_write('Команда телеуправління [%s] з ключем [%s] пристрою [%s] з форматом [%s]' % (sval, skey, devid, sformat))
    bsucc = True
    if sval in ('0', '1'):
        scmd = ''
        if (sformat.find('ON') < 0) and (sval == '1'):
            scmd = 'включення'
        elif (sformat.find('OF') < 0) and (sval == '0'):
            scmd = 'відключення'
        if scmd != '':
            log_write('Команда [%s] для ключа [%s] не передбачена' % (scmd, skey))
            bsucc = False
    else:
        log_write('Команда телеуправління [%s] не коректна.' % sval)
        bsucc = False

    if bsucc:
        sval = int('0xFF00' if sval == '1' else '0x0000', 16)
        log_write('Значення для запису: [%s]:' % sval)
        bsucc = modbus_write_ex(devid, addr, sval, 'coil')
        s = ('' if bsucc else 'не') + ' успішний'
        log_write('Запис значення %s в адресу %s - %s' % (sval, hex_ex(addr), s))
    return bsucc


# -----------------------------------------------------------------------------------------------#
#           Функція зчитування файлу JSON з контролем його наявності та цілісності               #
# -----------------------------------------------------------------------------------------------#
def load_jsonfile(fname, description):
    res = None
    sadd = 'відсутній'
    if os.path.exists(SCRIPT_PATH + fname):
        with open(fname, 'r') as f:
            try:
                res = json.load(f)
                sadd = 'завантажений'
            except json.JSONDecodeError:
                sadd = 'пошкоджений'
            except Exception as e:
                print(e)
    log_write('%s %s %s' % (description, fname, sadd))
    return res


# -----------------------------------------------------------------------------------------------#
#          Функція перевірки даних карти MODBUS на наявність всіх полів, відповідність           #
#                             типів полів та допустимі значення полів                            #
# -----------------------------------------------------------------------------------------------#
def check_map():
    # ------------------------------------------------#
    #  Функція додає повідомлення в загальний перелік #
    # ------------------------------------------------#
    def epush(ebuff, emsg):
        if emsg != '':
            if ebuff == '':
                ebuff = emsg
            else:
                ebuff = ebuff + '\n' + emsg
        return ebuff

    serr = ''
    # Основні поля карти - мають бути у всіх
    tmain = ('address', 'block', 'len', 'access', 'format')

    # Числові поля карти - мають бути у всіх полів формату NUM з доступом 0 (на запис), крім NUM3I0
    tnum = ('min', 'max', 'step')

    # Числові параметри дискретних входів карти - мають бути у всіх форматів NUMXDI
    tdi = ('inverse',)

    # Цикл по всім ключах карти
    for key in POINT.map:
        tmap = POINT.map[key]
        access = None
        for field in tmain:
            if field in tmap:

                # --- Для поля адреси ---
                if field == tmain[0]:
                    val = tmap[tmain[0]]
                    try:
                        val = int(val, 16)
                    except ValueError:
                        serr = epush(serr, 'Для ключа [%s] значення [%s] поля [%s] не є числом в шістнадцятковій '
                                           'системі числення' % (key, val, field))
                    except Exception as e:
                        print(e)

                # --- Для поля блока ---
                elif field == tmain[1]:
                    val = tmap[tmain[1]]
                    if type(val) == str:
                        if len(val) == 0:
                            serr = epush(serr, 'Для ключа [%s] відсутнє значення поля [%s]' % (key, field))
                    else:
                        serr = epush(serr, 'Для ключа [%s] значення [%s] поля [%s] не є строкою' %
                                     (key, val, field))

                # Для поля довжини
                elif field == tmain[2]:
                    val = tmap[tmain[2]]
                    if type(val) == int:
                        if (val <= 0) or (val > 9):
                            serr = epush(serr, 'Для ключа [%s] значення [%s] поля [%s] виходить за допустимі '
                                               'межі [1-9]' % (key, val, field))
                    else:
                        serr = epush(serr, 'Для ключа [%s] значення [%s] поля [%s] не є цілим числом' %
                                     (key, val, field))

                # --- Для поля доступу ---
                elif field == tmain[3]:
                    val = tmap[tmain[3]]
                    if type(val) == int:
                        if val in range(0, 6, 1):
                            access = val
                        else:
                            serr = epush(serr, 'Для ключа [%s] значення [%s] поля [%s] виходить за допустимі '
                                               'межі [0-6]' % (key, val, field))
                    else:
                        serr = epush(serr, 'Для ключа [%s] значення [%s] поля [%s] не є цілим числом' %
                                     (key, val, field))

                # --- Для поля формату ---
                elif field == tmain[4]:
                    sformat = tmap[tmain[4]]
                    if type(sformat) == str:
                        if len(sformat) == 6:
                            sadd = sformat[3:6:1]
                            if (sformat[0:3:1] == 'NUM') and (sadd != '3I0') and (access == 0):
                                # ---- Цикл перевірки числових полів ----
                                for nfield in tnum:
                                    if nfield in tmap:
                                        val = tmap[nfield]
                                        if sadd in ('XDI', '001'):
                                            bcheck = type(val) == int
                                        else:
                                            bcheck = (type(val) == int) or (type(val) == float)
                                        if bcheck:
                                            if val >= 0:
                                                # ---- Для поля step ---- #
                                                if nfield == tnum[2]:
                                                    if not (val in (0.01, 0.1, 1, 10, 100)):
                                                        serr = epush(serr, 'Для ключа [%s] значення [%s] поля [%s] не '
                                                                           'входить в перелік дозволених [0.01, 0.1, 1,'
                                                                           ' 10, 100]' % (key, val, nfield))
                                            else:
                                                serr = epush(serr, "Для ключа [%s] значення [%s] поля [%s] від'ємне" %
                                                             (key, val, nfield))
                                        else:
                                            sint = ' цілим' if sadd == 'XDI' else ''
                                            serr = epush(serr, 'Для ключа [%s] значення [%s] поля [%s] не є%s числом' %
                                                         (key, val, nfield, sint))
                                    else:
                                        serr = epush(serr, 'Для ключа [%s] відсутнє поле [%s]' % (key, nfield))

                                if sadd == 'XDI':
                                    # ---- Цикл перевірки дискретних входів ----
                                    for nfield in tdi:
                                        if nfield in tmap:
                                            val = tmap[nfield]
                                            if type(val) == int:
                                                if not (val in (0, 1)):
                                                    serr = epush(serr, 'Для ключа [%s] значення [%s] поля [%s] '
                                                                       'не входить в перелік дозволених [0 - 1]' %
                                                                 (key, val, nfield))
                                            else:
                                                serr = epush(serr, 'Для ключа [%s] значення [%s] поля [%s] не є '
                                                                   'цілим числом' % (key, val, nfield))
                                        else:
                                            serr = epush(serr, 'Для ключа [%s] відсутнє поле [%s]' % (key, nfield))
                                # ---- Кінець перевірки числових форматів ----
                        else:
                            serr = epush(serr, 'Для ключа [%s] значення [%s] поля [%s] складається з %s символів при '
                                               'допустимій кількості 6 символів' %
                                         (key, sformat, field, len(sformat)))
                    else:
                        serr = epush(serr, 'Для ключа [%s] значення [%s] поля [%s] не є строкою' %
                                     (key, sformat, field))

            else:
                serr = epush(serr, 'Для ключа [%s] відсутнє поле [%s]' % (key, field))
    if serr != '':
        serr = epush('Структура карти памяті MODBUS порушена:', serr)
        log_write(serr)
    return serr == ''


# -----------------------------------------------------------------------------------------------#
#        Функція коректного отримання даних із словника налаштувань з контролем типу значення    #
#        а також перевірки наявності секції                                                      #
# -----------------------------------------------------------------------------------------------#
def get_config_value(section, key='', asnumber=False, forceint=False, default=None):
    if section in POINT.configuration:
        if key == '':
            return True
        else:
            if key in POINT.configuration[section]:
                res = POINT.configuration[section][key]
                if asnumber:
                    res = convert_value_to_numeric_def(res, forceint, default)
                return res
            else:
                log_write('Ключ [%s] відсутній у розділі [%s] файлу конфігурації' % (key, section))
                return default
    else:
        log_write('Розділ [%s] відсутній у файлі конфігурації' % section)
        return default


# -----------------------------------------------------------------------------------------------#
#        Функція коректного отримання даних із словника словників налаштувань з контролем типу   #
#        значення а також перевірки наявності секції                                             #
# -----------------------------------------------------------------------------------------------#
def get_config_value2(section, key, subkey, default=None):
    if section in POINT.configuration:                                       # Якщо секція є в файлі конфігурації
        if key in POINT.configuration[section]:                                  # Якщо ключ є в секції
            if subkey in POINT.configuration[section][key]:
                return POINT.configuration[section][key][subkey]
            else:
                log_write('Для запису [%s] в розділі [%s] файлу конфігурації відсутній параметр [%s]' %
                          (key, section, subkey))

        else:                                                       # Якщо ключа немає в секції
            log_write('Ключ [%s] відсутній у розділі [%s] файлу конфігурації' % (key, section))
            return default
    else:
        log_write('Розділ [%s] відсутній у файлі конфігурації' % section)
        return default


# -----------------------------------------------------------------------------------------------#
#        Функція що очікує появи файлу message.txt із командою, що зазвичай передається по MQTT  #
#        в директорії Msg, що розташована в директорії зі скриптом. Такий собі емулятор MQTT     #
# -----------------------------------------------------------------------------------------------#
def read_mqtt_command_from_file():
    global SCRIPT_PATH
    curr_sname = 'message.txt'
    msg_path = SCRIPT_PATH + 'Msg\\'
    if os.path.exists(msg_path):
        if os.path.exists(msg_path + curr_sname):
            try:
                curr_file = open(msg_path + curr_sname, 'r')
                command = curr_file.read()
                curr_file.close()
                mqtt_on_message('xmqclient','userdata', command)
                try:
                    os.remove(msg_path + curr_sname)
                except PermissionError:
                    print('Неможливо відкрити видалити %%. ' % msg_path + curr_sname)
            except PermissionError:
                msg_path = msg_path + curr_sname
                print('Неможливо відкрити файл %s. ' % msg_path)
            except Exception as e:
                print(e)
        # else:
        #     print ('waiting')
    else:
        print('Відсутня папка %s. ' % msg_path)

# -----------------------------------------------------------------------------------------------#
#               Функція визначає, чи запущений скрипт під лінукс чи ні.                          #
#                    Для інакшої роботи скрипта під windows #                                    #
# -----------------------------------------------------------------------------------------------#
def os_is_linux():
    slinux = ('posix', 'linux')
    return os.name in slinux

# -----------------------------------------------------------------------------------------------#
#                           Функція створює MQTT з'єднання                                       #
# -----------------------------------------------------------------------------------------------#
def mqtt_connection_create():
    id = get_config_value('mqttServer', 'client_id')
    ip = get_config_value('mqttServer', 'ip')
    port = get_config_value('mqttServer', 'port', True, True)
    user = get_config_value('mqttServer', 'user')
    psw = get_config_value('mqttServer', 'pass')
    topic = get_config_value('mqttServer', 'request_topic')
    if None in (id, ip, port, user, psw, topic): return None

    mqcl = mqtt.Client(id)
    mqcl.on_connect = mqtt_on_connect
    mqcl.on_message = mqtt_on_message
    try:
        mqcl.username_pw_set(username=user, password=psw)
        mqcl.connect(ip, port=port)
        log_write("З'єднання з MQTT сервером успішне")
        return mqcl
    except TimeoutError:
        log_write("З'єднання з MQTT сервером не успішне. Зупинка роботи")
        return None
    except Exception as e:
        print(e)

def build_path():
    id = get_config_value('server', 'client_id')
    ip = get_config_value('server', 'ip')
    port = get_config_value('server', 'port', True, True)
    path = 'ws://'+str(ip)+':'+str(port)+'/ws/point/'+str(id)+'/'
    return path
# =========================== Блок функцій обробки повідомлення =============================== #
# ----------------------------------------------------------------------------------------------#
# Функція розділяє повідомлення на складові та перевіряє їх наявність та корректність, а саме:  #
# 1. Номер пристрою має бути серед зареєстрованих                                               #
# 2. Команда має бути в повідомленні та бути стандартна                                         #
# 3. Ключ має бути в повідомленні та бути в карті модбас                                        #
# 4. Для запису значення має бути в повідомленні. Воно може містити навіть символи |            #
# - Відповідність значення формату не перевіряється, бо це робить кожна функція запису окремо - #
# Вертає кортеж (devid, scmd, xaddrm, xlen, sformat) або None                                   #
# ----------------------------------------------------------------------------------------------#
# Стандартні команди:    devid|cmd|author|modbus_key, де:                                       #
#   devid - номер пристрою, до якого звертаємося                                                #
#   cmd: get - зчитати з пристрою, set - записати в пристрій, tu - телеуправління пристрою      #
#   author - назва топіку на який буде відправлена відповідь                                    #
#   modbus_key - ключ зі словника карти modbus, з яким треба звернутися до пристрою             #
# ----------------------------------------------------------------------------------------------#
def check_device_request_message(message):
    devid, scmd, skey, xaddr, xlen, sformat, sval, author = '        '
    bsucc = False
    sa = str(message).split('|')
    # Перевіряємо наявність номера пристрою,  команди та автора повідомлення
    if len(sa) >= 2:
        if is_numeric(sa[0], True):
            devid = int(sa[0])
            if (devid > 0) and (devid < 248):
                if str(devid) in POINT.devices:
                    # Перевіряємо команду
                    scmd = sa[1]
                    if scmd in ('get', 'set', 'tu'):
                        # Перевіряємо наявність автора
                        author = len(sa) >= 3
                        if author: author = sa[2] != ''
                        if author:
                            author = sa[2]
                            # Перевіряємо наявність ключа
                            if len(sa) >= 4:
                                skey = sa[3]
                                # Перевіряємо ключ
                                if skey in POINT.map:
                                    # Зчитуємо параметри ключа для роботи
                                    xaddr = int(POINT.map[skey]['address'], 0)
                                    xlen = int(POINT.map[skey]['len'])
                                    sformat = POINT.map[skey]['format']
                                    access = POINT.map[skey]['access']
                                    # -------- Блок зчитування --------
                                    if scmd == 'get':
                                        # Якщо ключ передбачає читання ф03 та запис ф06,
                                        if access in (0, 1):
                                            # Виконуємо команду читання, отримуємо зчитане значення
                                            log_write('Зчитування значення з адреси [%s] пристрою [%s] з '
                                                      'ключем [%s] регістрів [%s] в форматі [%s] з доступом ' 
                                                      '[%s]' % (hex_ex(xaddr), devid, skey, xlen, sformat, access))
                                            sval = ''
                                            bsucc = True
                                        else:
                                            log_write('Ключ [%s] не передбачає зчитування' % skey)
                                    # -------- Блок запису --------
                                    elif scmd == 'set':
                                        # Перевіряємо наявність значення для запису
                                        if len(sa) > 4:
                                            # Все, що після команди set збираємо назад
                                            sval = ''
                                            xpos = 4
                                            while xpos < len(sa):
                                                sval = sval + '|' + sa[xpos]
                                                xpos = xpos + 1
                                            sval = sval[1:len(sval):1]

                                            if (sval != '') or (sformat == 'STRING'):
                                                if access in (0, 6):
                                                    log_write('Запис значення [%s] в адресу [%s] пристрою [%s] з '
                                                              'ключем [%s] регістрів [%s] в форматі [%s] з доступом '
                                                              '[%s]' %
                                                              (sval, hex_ex(xaddr), devid, skey, xlen, sformat, access))
                                                    bsucc = True
                                                else:
                                                    log_write('Ключ [%s] не передбачає запису' % skey)
                                            else:
                                                log_write('Відсутнє значення для запису')
                                        else:
                                            log_write('Відсутнє значення для запису')
                                    # -------- Блок телеуправління --------
                                    else:
                                        # Перевіряємо наявність значення для запису
                                        if len(sa) > 4:
                                            sval = sa[4]
                                            if access == 2:
                                                log_write('Запис значення [%s] в адресу [%s] пристрою [%s] з '
                                                          'ключем [%s] регістрів [%s] в форматі [%s] з доступом [%s]' %
                                                          (sval, hex_ex(xaddr), devid, skey, xlen, sformat, access))
                                                bsucc = True
                                            else:
                                                log_write('Ключ [%s] не передбачає телеуправління' % skey)
                                        else:
                                            log_write('Відсутнє цільове положення керованого інструменту')
                                else:
                                    log_write('Ключ [%s] відсутній в карті MODBUS' % skey)
                            else:
                                log_write('Повідомлення не містить цільового ключа даних')
                            # --------
                        else:
                            log_write('Не вказаний автор повідомлення')
                    else:
                        log_write('Команда [%s] не коректна' % scmd)
                else:
                    log_write('Вказаний номер [%s] цільового пристрою, відсутній в мережі MODBUS' % devid)
            else:
                log_write('Вказаний номер [%s] цільового пристрою, не можливий в мережі MODBUS' % devid)
        else:
            log_write('Вказаний номер [%s] цільового пристрою, не коректний' % sa[0])
    else:
        log_write('Повідомлення не містить цільової команди.')

    if bsucc:
        return devid, scmd, author, skey, xaddr, xlen, sformat, sval
    else:
        return None



# ----------------------------------------------------------------------------------------------#
# Функція перевіряє, чи повідомлення містить системну команду і вертає її та ідентифікатор      #
# автора запитання, або None                                                                    #
# ----------------------------------------------------------------------------------------------#
def check_system_request_message(message):
    sa = message
    print(len(sa[3]))
    if len(sa[3]) == 0:
        # Стандартна команда для всіх пристроїв Команда|Автор
        if sa[2] in (StdCommands.scan_devices, StdCommands.stop_script,
                     StdCommands.clear_screen, StdCommands.show_devices):
            if len(sa[1]) > 0:
                return sa[0], sa[1]
    elif len(sa[3]) == 1:
        # Стандартна команда для одного пристрою Номер пристрою|Команда|Автор
        print(sa[3]['key'])
        if sa[2] == StdCommands.monitoring:
            if is_numeric(sa[3]['key']):
                print(sa[3]['key'], POINT.devices)
                if str(sa[3]['key']) in POINT.devices:
                    print(sa[2], sa[1], sa[3]['key'])
                    return sa[2], sa[1], sa[3]['key']
    return None


# ----------------------------------------------------------------------------------------------#
#       Функція аналізує повідомлення на корректність, виконує запит до пристрою та надсилає    #
#                               відповідь автору повідомлення по MQTT                           #
# ----------------------------------------------------------------------------------------------#
def processing_message(message):
    param = check_system_request_message(message)                                   # Розбиваємо повідомлення на складові та отримуємо масив параметрів системних повідомлень
    print(param)
    if param is None:                                                               # Якщо повідомлення не схоже системне
        # Повідомлення про зчитування : devid|get|author|key
        # Повідомлення про запис : devid|set|author|key|value
        devid = ''
        scmd = ''
        skey = ''
        param = check_device_request_message(message)                                   # Перевіряємо повідомлення та отримуємо масив параметрів
        if param is not None:                                                           # Якщо повідомлення коректне
            # Поділ на команди та виклик відповідних фунцій - агрегаторів
            devid, scmd, author, skey, xaddr, xlen, sformat, sval = param                   # Переносимо значення параметрів з масиву в змінні (для читабельності)
            if scmd == 'get':                                                                   # Для команди зчитування
                res = read_single_values(devid, xaddr, xlen, sformat)
                bsucc = (res is not None)
            elif scmd == 'set':                                                                 # Для команди запису
                bsucc = write_single_values(devid, xaddr, sval, xlen, sformat, skey)
                res = sval  # ('Запис' + ('' if bsucc else ' не') + ' успішний')
            elif scmd == 'tu':                                                                  # Для телеуправління
                bsucc = write_telecontrol(devid, xaddr, sval, skey, sformat)
                res = sval
            else:                                                                               # Все інше
                bsucc = False
                res = 'Зарезервовано для нестандартних функцій. Команди нестандартних ' \
                      'функцій треба додати в check_device_request_message'
                log_write(res)
        else:                                                                           # Якщо повідомлення не коректне
            bsucc = False
            author = get_config_value('mqttServer', 'request_topic') + '_'                  # Так як автор не відомий - відправляти будемо туда, звідки повідомлення надійшло з підкресленням,
            res = 'Повідомлення [' + message + '] пошкоджене'                               # Готуємо повідомлення
            log_write(res)                                                                  # Пишемо протокол
        bsucc = '1' if bsucc else '0'                                                   # Визначаємо символ успішності для повідомлення
        message = '%s|%s|%s|%s|%s' % (bsucc, devid, scmd, skey, res)                    # Готуємо повідомлення

    else:                                                                           # Якщо повідомлення системне (Команда|автор або Ккоманда|автор|Номер пристрою)
        author = param[1]                                                               # Зберігаємо автора
        if param[0] == StdCommands.scan_devices:                                        # Якщо команда сканування пристроїв
            bsucc = '1' if modbus_scan_devices(author) else '0'                             # Скануємо пристрої та отримуємо ознаку успіху
            message = '%s|%s|%s' % (bsucc, param[0], StdScanResponce.scan_complete)           # Формуємо повідомлення

        elif param[0] == StdCommands.stop_script:                                       # Якщо команда зупинку скрипта
            message = '1|%s' % param[0]                                                     # Формуємо повідомлення про успіх
            text_data = json.dumps({
                'message': message
            })
            POINT.send(text_data)
            # CONNECTION.publish(author, message, qos=0)                                     # Відправляємо повідомлення
            log_write('=== Віддалена зупинка скрипта ===')                                  # Пишемо лог
            # POINT._requests.append('=== STOP DAEMON ===')

        elif param[0] == StdCommands.clear_screen:                                      # Якщо команда очистки екрану
            message = '1|%s' % param[0]                                                     # Формуємо повідомлення про успіх
            if (os_is_linux()):
                os.system('clear')                                          # Ощищуємо термінал в лінукс системі
            else:
                log_write('Zero-effect in not linux system')

        elif param[0] == StdCommands.show_devices:                                      # Якщо команда переглянути зареєстровані пристрої
            log_devices('', POINT.devices)
            str_devinfo = ''                                                                # Готуємо буффер
            for i in POINT.devices:                                                               # Переглядаэмо всі пристрої
                if (str_devinfo != ''): str_devinfo = str_devinfo + '|'                         # Додаєио розділювач в буфер
                str_devinfo = str_devinfo + '%s: %s' % (i, POINT.devices[i])                            # Додаємо в буфер інформацію про пристрій
            message = '1|%s|%s' % (param[0], str_devinfo)                                     # Формуємо повідомлення

        elif param[0] == StdCommands.monitoring:                                        # Якщо команда моніторингу
            devid = int(param[2])                                                           # Берем номер пристрою
            section = 'Monitoring'                                                          # Секція в файлі налаштувань
            if get_config_value(section):                                                   # Якщо серед налаштувань є секція моніторингу
                mon_vals = []                                                                   # Готуємо буфер
                for xkey in POINT.configuration[section]:                                                    # Перебираємо всі ключі секції
                    skey = POINT.configuration[section][xkey]                                                    # Отримуємо ключ modbus, який необхідно зчитати
                    # log_write('Ключ %s моніторингу: ' % skey)
                    if skey in POINT.map:                                                                 # Якщо ключ є в мапі modbus
                        xaddr = int(POINT.map[skey]['address'], 0)                                            # Отримуємо з мапи адресу
                        xlen = int(POINT.map[skey]['len'])                                                    # Кількість регісрів
                        sformat = POINT.map[skey]['format']                                                   # Формат
                        access = POINT.map[skey]['access']                                                    # Права доступу
                        if access in (0, 1):                                                            # Якщо права на читання або на запис та читання
                            res = read_single_values(devid, xaddr, xlen, sformat)                           # Зчитуємо значення
                        else:                                                                           # Якщо інші права
                            log_write('Ключ [%s] не передбачає зчитування' % skey)                          # Пишемо протокол
                            res = ''                                                                        # Значення порожнє
                    else:                                                                           # Якщо ключ відсутній в мапі modbus
                        log_write('Ключ [%s] відсутній в карті MODBUS' % skey)                          # Пишемо протокол
                        res = ''                                                                        # Значення відсутнє
                    mon_vals.append(res)                                                            # Додаємо результат в буфер
                res = '|'.join(mon_vals)                                                        # Формуємо рядок результатів
                message = {
                    'status': 1,
                    'devid': devid,
                    'VD': {
                        '1': mon_vals[0][7],
                        '2': mon_vals[0][6],
                        '3': mon_vals[0][5],
                        '4': mon_vals[0][4],
                        '5': mon_vals[0][3],
                        '6': mon_vals[0][2],
                        '7': mon_vals[0][1],
                        '8': mon_vals[0][0],
                    },
                    'DI': {
                        '1': mon_vals[1][0],
                        '2': mon_vals[1][1],
                        '3': mon_vals[1][2],
                        '4': mon_vals[1][3],
                    },
                    'date': mon_vals[2],
                    'kwitEvent': mon_vals[3],
                    'current_A': mon_vals[4],
                    'current_B': mon_vals[5],
                    'current_C': mon_vals[6],
                }
                # message = '1|%s|%s|%s' % (devid, param[0], res)                                 # Формуємо успішне повідомлення
            else:                                                                           # Якщо серед налаштувань відсутня секція моніторингу
                message = {
                    'status': 0,
                    'devid': devid,
                    'req': param[0],
                }
                # message = '0|%s|%s' % (devid, param[0])                                         # Формуємо не успішне повідомлення
    # ---------------------------------------
    text_data = json.dumps([3, param[1], message, param[0]])
    POINT.send(text_data)
    # CONNECTION.publish(author, message, qos=0)
    # log_write('Send response to server %s' % (text_data))



# ----------------------------------------------------------------------------------------------#
#             Функція обробляє всі необроблені повідомлення. Працює в окремому потоці           #
# Для зупинки демона використовується затичка у вигляді додавання штучного запиту  STOP DAEMON  #
# Безпосередня зупинка виконується в функції mqtt_on_message під час надходження наступного     #
# запиту                                                                                        #
# ----------------------------------------------------------------------------------------------#
def request_daemon():
    stop_daemon = False
    while True:
        # while len(POINT._requests) > 0:                                # Якщо є не оброблені запити
        #     if (POINT._requests[0] == '=== STOP DAEMON ==='):              # Якщо поточний запит на зупмнку демоу
        #         stop_daemon = True                                      # Позначаємо, що необхідно завершити процедуру
        #         break                                                   # Перериваємо перегляд буферу
        #     else:                                                   # Якщо поточний запит зовнішній
        #         processing_message(POINT._requests[0])                         # Обробляємо запит
        #         print('procesing ok')
        #         POINT._requests.pop(0)                                         # Видаляємо запит з буферу
        #         print('procesing delete ok')
        # time.sleep(POINT.request_time)
        # if (stop_daemon ): break;                                   # Якщо необхідно зупинити демона - виходимо з циклу
        while len(POINT._requests) > 0:  # Якщо є не оброблені запити
            processing_message(POINT._requests[0])                         # Обробляємо запит
            print('procesing ok')
            POINT._requests.pop(0)                                         # Видаляємо запит з буферу
            print('procesing delete ok')
        time.sleep(POINT.request_time)





# --------------------------------------------------------------------------------------------- #
#                            Безпосередньо код програми при старті                              #
# Використані глобальні змінні                                                                  #
# SCRIPT_PATH    - шлях до скрипта. Визначається автоматично                                    #
# SERIAL_PORT    - об'єкт порта MODBUS. Доступний для відкриття/закриття                        #
# SILENT         - вказівка не вести протокол роботи скрипта (з налаштувань або ведеться)       #
# DEVICES        - Словник пристроїв, який під час сканування наповнюється базовими для пристрою#
#                  значеннями                                                                   #
#   Ключі словника - це номера наявних пристроїв (ті, що відповіли)                             #
#   Значення запису словника - це також словник із                                              #
#        1. "DevType"  - Тип пристрою та притаманних конкретному пристрою значень:              #
#        2. "Kts"      - Коефіцієнт трансформації трансформаторів струму                        #
# BUFFER      - Глобальний словник пристроїв в якому під час зчитування з пристрою зберігаються #
#              словники нещодавно прочитаних адрес                                              #
#   Ключі словника - це номера наявних пристроїв (ті, що нещодавно опиталися)                   #
#   Значення запису словника - це також словник із прочитаних десяткових адрес                  #
#       Ключі словника - це прочитана десяткова адреса                                          #
#       Значення запису словника - це також словник із прочитаного інтерпретованого значення та #
#                                  часу зчитуванняс                                             #
#           "time"  - Час останнього зчитування з конкретної адреси                             #
#           "value" - Інтерпретоване останнє значення, що було прочитане з конкретної адреси    #
# CONFIG         - словник зовнішніх налаштувань скрипта (зчитується з файлу config.json)       #
# REQUEST_TIME   - число (сек), яке дається на безперервну комінікацію з одним пристроєм перед  #
# початком комунікації з іншим пристроєм                                                        #
# RELEVANCE_TIME - Час актуальності зчитаних з пристроя даних та час циклічного опитування      #
#                  струмів пристроїв (їх можна розділити додатковим параметром)                 #
# MAP            - словник сумісної карти MODBUS всіх типів пристроїв (зчитується з файлу       #
#                  modBusmap.json)                                                              #
# MODBUS_MASTER  - Об'єкт класу modbus_tk, через який здійснюється зчитування з пристроїв по    #
# #                протоколу MODBUS                                                             #
# CONNECTION    - Об'єкт класу Mqtt.Client, через який здійснюється обмін даних із зовнішнім   #
#                  сервером                                                                     #
# REQUESTS       - перелік не оброблених запитів, що надійшли по MQTT (обробляються демоном в   #
#                  окремому потоці, щоб не зптримувати цикл очікування Mqtt                     #
# --------------------------------------------------------------------------------------------- #


# ----- Завантаження карти MODBUS ----- #

def on_close(ws):
    print('disconnected from server')
    print("Retry : %s" % time.ctime())
    time.sleep(10)
    POINT.ws_thread.join()
    POINT.connect()
    POINT.ws_thread = threading.Thread(target=POINT.connection.run_forever)
    POINT.ws_thread.start()

def on_error(ws, error):
    print(error)
    if 'Connection to remote host was lost' in error:
        POINT.ws_thread.join()
        print(error)
        print('disconnected from server')
        print("Retry : %s" % time.ctime())
        # POINT.connect()

def on_open(ws):
    time.sleep(4)
    print('connection established')

class Point():
    def __init__(self):
        self.cur_ver = '0.8.3'
        self.script_path = ''
        self.serial_port = False
        self.silent = False
        self.devices = {}
        self.buffer = {}
        self._requests = []
        self.connection = False
        self.ws_thread = False
        self.configuration = False
        self.request_time = False
        self.relevance_time = False
        self.map = False
        self.modbus_master = False
        self.listen_requests = False

    # -------------------------------------------------------------------------------
    #   Функція для надсилання команд в ОС;
    def sendOsCmd(self, cmd):
        p = Popen(cmd, stdout=PIPE, stderr=PIPE)
        stdout, stderr = p.communicate()
        return stdout
    # _______________________________________________________________________________


    # -------------------------------------------------------------------------------
    #   Функція для видобутку з бази даних актуальну версію ПЗ. Використовується у
    #   функції compare();
    def getBaseVer(self):
        db = pymysql.connect(host="109.207.113.154", user="plm", passwd="plaSystem0!@#", port=3307)
        cur = db.cursor()
        command = 'SELECT versions FROM plmadmin.Users_rpisoftwareversions ORDER BY id DESC LIMIT 1;'
        cur.execute(command)
        ver = cur.fetchone()
        return ver[0]

    # _______________________________________________________________________________

    def compare(self):
        curVer = self.cur_ver
        locVer = getBaseVer()
        if curVer != locVer:
            ftp = ftplib.FTP()
            HOST = '109.207.113.154'
            PORT = 5960
            try:
                ftp.connect(HOST, PORT)
                ftp.login(user='rpi', passwd='plasystem')
                ftp.cwd(str(locVer))
                files = ftp.nlst()
                for filename in files:
                    host_file = os.path.join(
                        '', filename
                    )
                    try:
                        with open(host_file, 'wb') as local_file:
                            ftp.retrbinary('RETR ' + filename, local_file.write)
                    except ftplib.error_perm:
                        pass
                ftp.quit()
            except:
                pass
                sendOsCmd(["sudo", "systemctl", "restart", "script.service"])

    def serial_init(self):
        try:
            self.serial_port = serial.Serial()
            try:
                print('serial ok')
                prepare_serial()
            except Exception as e:
                print(f'Serial prepare error with exception: {e}')
                return False
        except Exception as e:
            print(f'Serial init error with exception: {e}')
            return False

    def clear_os(self):
        if os_is_linux():    os.system('clear')

    def load_config(self):
        try:
            self.configuration = load_jsonfile('config.json', 'Файл конфігурації')
        except Exception as e:
            print(f'Load config error with exception: {e}')

    def load_config_value(self):
        try:
            self.request_time = get_config_value('Other', 'request_time', True, False, 0.1)
            self.silent = get_config_value('Other', 'silent', True, True, 0) != 0
            self.relevance_time = get_config_value('Other', 'relevance_time', True, False, 0)
        except Exception as e:
            print(f'Load config value error with exception: {e}')

    def load_map(self):
        try:
            self.map = load_jsonfile('modBusmap.json', 'Файл карти памяті MODBUS')
        except Exception as e:
            print(f'Load modbus map error with exception: {e}')

    def connect(self):
        try:
            id = get_config_value('server', 'client_id')
            ip = get_config_value('server', 'ip')
            port = get_config_value('server', 'port', True, True)
            path = f'ws://{ip}:{port}/ws/point/{id}/'
            self.connection = websocket.WebSocketApp(path, on_open=on_open, on_close=on_close, on_message=on_message, on_error=on_error)
            self.ws_thread = threading.Thread(target=self.connection.run_forever)
            self.ws_thread.start()
            print('Connected')
        except Exception as e:
            print(f'Connection error with exception: {e}')

    def modbus_init(self):
        try:
            self.modbus_master = modbus_initconnect()
        except Exception as e:
            print(f'Modbus error with exception: {e}')

    def scan_device(self):
        try:
            modbus_scan_devices('oninit')
            return True
        except Exception as e:
            print(f'Scan error with exception: {e}')
            return False
    def send(self, message):
        message = json.dumps(message)
        self.connection.send(message)
        print(f'Send to server : {message}')

POINT = None
if __name__ == '__main__':
    onstart_log_prepare()
    print('prepare ok')
    POINT = Point()
    print('create class ok')
    POINT.clear_os()
    print('clear os ok')
    POINT.load_config()
    print('load config ok')
    if not POINT.configuration:
        print('config error')
    POINT.load_config_value()
    print('load config value ok')
    POINT.load_map()
    print('load map ok')
    if not check_map():
        print('map error')
    POINT.connect()
    print('connection thread ok')
    POINT.serial_init()
    print('serial init ok')
    POINT.modbus_init()
    print('modbus init ok')
    if not POINT.modbus_master:
        print('modbus error')
    POINT.scan_device()
    POINT.listen_requests = threading.Thread(target=request_daemon, daemon=True)
    POINT.listen_requests.start()
    print(POINT.devices)
    while True:
        if not POINT.ws_thread.isAlive():
            print('Server connection lost. Reconnection')
            POINT.connect()
        time.sleep(2)
