# Node-Redis

Задача:<br />
Разработать Node-приложение, которое взаимодействует с Redis и может как генерировать сообщения, так и принимать. Одновременно может быть запущено сколько угодно node-приложений.<br />
Обмен информацией между node-приложениями может быть только через Redis.<br />
Из всего кол-ва текущих запущенных node-приложений только одно - является генератором, остальные являются слушателями и всегда должны быть готовы принимать сообщения из Redis.<br />
Все сообщения должны быть обработаны только один раз и только одним слушателем.<br />
Генератором может быть только одно node-приложение, каждое из запущенных приложений может стать генератором.<br />
Если текущий генератор принудительно завершится(например, отключили из розетки), то один из слушателей(любой) должен сразу стать генератором. Для определения, кто генератор, нельзя использовать средства ОС.<br />
Сообщения генерируются раз в 500ms.<br />
Слушателем с вероятностью 5% считает полученное сообщение ошибочным.<br />
Ошибочное сообщение нужно поместить в Redis для дальнейшего изучения.<br />
Если запустить приложение с параметром getErrors: оно заберет из Redis все сохраненные сообщения, выведет их на экран и завершится, при этом сами сообщения из Redis удаляются.
