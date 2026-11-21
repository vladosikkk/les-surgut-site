export function orangeryPage({photo, link, book, i, contacts}) {
 const formats = [
  ['Свадьба среди сосен', 'Церемония, праздничный ужин и вечер под тёплым светом гирлянд. Лес станет естественным фоном для вашего дня.', 'Свадьба'],
  ['Семейный праздник', 'День рождения, юбилей или годовщина. Один длинный стол, любимые люди и время, которое хочется провести вместе.', 'Семейный праздник'],
  ['Встреча команды', 'Неформальный корпоратив, презентация или ужин с партнёрами. Смена обстановки, новые идеи и общение за пределами офиса.', 'Встреча команды'],
  ['Ваш особенный повод', 'Выпускной, творческий бранч, мастер-класс или фотосессия. Расскажите свою идею — вместе подумаем, как вписать её в пространство.', 'Особенное событие']
 ];
 return `
 <section class="orangery-heading wrap">
  <div class="orangery-breadcrumb"><a href="/events/">Мероприятия</a><span aria-hidden="true">/</span><span>Скоро в «Лесу»</span></div>
  <div class="orangery-title-row"><div><span class="eyebrow">НОВОЕ ПРОСТРАНСТВО СРЕДИ СОСЕН</span><h1>Оранжерея</h1></div><div class="orangery-intro"><p>Ваши важные встречи.<br>В окружении леса.</p><span>Планируем открытие в <strong>мае 2027</strong></span></div></div>
 </section>
 <figure class="orangery-hero">
  ${photo('orangery-reference','Концепция Оранжереи: стеклянный павильон с тёплым светом среди сосен','',true,'(max-width: 767px) 100vw, 96vw')}
  <figcaption><span>Стекло. Тёплый свет. Настоящий лес.</span><span>Образ будущего пространства · визуализация</span></figcaption>
 </figure>
 <div class="orangery-quick wrap"><span>Скоро в «Лесу», Сургут</span><a href="#orangery-formats">Выбрать повод ${i('arrow-right')}</a>${book('Обсудить событие','orangery','Оранжерея')}</div>
 <section class="orangery-story wrap">
  <div class="orangery-story-heading reveal"><span class="eyebrow">ЛЕС — ЧАСТЬ ВАШЕГО ПРАЗДНИКА</span><h2>Под стеклянной крышей.<br>Среди настоящих сосен.</h2></div>
  <div class="orangery-story-copy reveal"><p>Мы готовим в «Лесу» новое место для встреч — прозрачный павильон, в котором природа становится частью события.</p><p>Днём здесь хочется собраться за красиво накрытым столом и смотреть на лес сквозь стекло. Вечером — зажечь огни, произнести важные слова и задержаться ещё немного.</p><p>В вашей истории могут быть белые цветы, любимая музыка и самый близкий круг. А могут — большая встреча, смех и новый повод увидеться.</p></div>
  <figure class="orangery-daylight"><button data-media="orangery-daylight" data-caption="Оранжерея днём — визуализация будущего интерьера" aria-label="Рассмотреть дневной интерьер Оранжереи">${photo('orangery-daylight','Визуализация: светлый интерьер Оранжереи, два длинных стола и сосны за стеклом','',false, '(max-width: 767px) 100vw, 90vw')}<span class="orangery-image-open">${i('plus')}Рассмотреть</span></button><figcaption>Дневной свет, прозрачная крыша и лес за каждым окном. Визуализация.</figcaption></figure>
 </section>
 <section class="orangery-formats wrap" id="orangery-formats">
  <div class="orangery-formats-heading reveal"><span class="eyebrow">КАКИМ БУДЕТ ВАШ ДЕНЬ?</span><h2>Для поводов,<br>которые сближают.</h2><p>Идеи для будущих событий. Формат, оформление и возможности площадки обсудим с вами лично.</p></div>
  <div class="orangery-format-list">${formats.map(([title,text,reason],index)=>`<article class="orangery-format reveal"><span class="orangery-format-number">0${index+1}</span><div><h3>${title}</h3><p>${text}</p><button class="text-link" data-book data-house="orangery" data-reason="Оранжерея: ${reason}">Обсудить этот формат ${i('arrow-up-right')}</button></div></article>`).join('')}</div>
 </section>
 <section class="orangery-atmosphere wrap" aria-labelledby="orangery-atmosphere-title" data-gallery-group>
  <div class="orangery-atmosphere-heading reveal"><span class="eyebrow">КОГДА ЗАЖИГАЮТСЯ ОГНИ</span><h2 id="orangery-atmosphere-title">Вечер становится<br>особенным.</h2><p>Мягкий свет над столом. Сосны за стеклом. И разговоры, которые не хочется заканчивать.</p></div>
  <figure class="orangery-evening"><button data-media="orangery-evening" data-caption="Оранжерея вечером — визуализация будущей площадки" aria-label="Рассмотреть вечерний вид Оранжереи">${photo('orangery-evening','Визуализация: вечерняя Оранжерея с подсветкой, деревянной дорожкой и хвойным лесом','',false, '(max-width: 767px) 100vw, 60vw')}<span class="orangery-image-open">${i('plus')}Рассмотреть</span></button><figcaption>Вечерний образ будущей площадки. Визуализация.</figcaption></figure>
  <figure class="orangery-table"><button data-media="orangery-table" data-caption="Сервировка в Оранжерее — идея оформления, визуализация" aria-label="Рассмотреть сервировку в Оранжерее">${photo('orangery-table','Визуализация: льняная сервировка, белые цветы и свечи внутри стеклянного павильона','',false, '(max-width: 767px) 100vw, 35vw')}<span class="orangery-image-open">${i('plus')}Рассмотреть</span></button><figcaption>Цветы, лён и свечи — один из вариантов настроения. Визуализация.</figcaption></figure>
 </section>
 <section class="orangery-stay wrap reveal"><span class="eyebrow">ПРОДОЛЖИТЬ ВСТРЕЧУ В «ЛЕСУ»</span><h2>Не спешите<br>возвращаться в город.</h2><div><p>Если захочется остаться с близкими на ночь, поможем подобрать один или несколько домов комплекса. Доступность и условия размещения уточним под вашу дату.</p>${link('Посмотреть дома','/houses/')}</div></section>
 <section class="orangery-invite wrap" id="orangery-contact"><div class="reveal"><span class="eyebrow">СКОРО В «ЛЕСУ»</span><h2>Начнём<br>с вашей идеи.</h2></div><div class="orangery-invite-copy reveal"><p>Расскажите о поводе, желаемой дате и количестве гостей. Поделимся новостями Оранжереи и обсудим ваш сценарий.</p>${book('Обсудить моё событие','orangery','Оранжерея')}<a class="orangery-direct" href="tel:${contacts.phoneRaw}">Или позвоните: ${contacts.phone} ${i('arrow-up-right')}</a><p class="orangery-opening-note">Открытие планируется в мае 2027. Точную дату, доступные форматы и условия подтвердит менеджер. Изображения передают концепцию будущего пространства.</p></div></section>
 `;
}
