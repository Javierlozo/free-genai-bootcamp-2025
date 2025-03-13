-- Sample flashcard data
insert into flashcards (word, images, review_count) values
(
  'mountain',
  array[
    'https://via.placeholder.com/300?text=Mountain1',
    'https://via.placeholder.com/300?text=Mountain2',
    'https://via.placeholder.com/300?text=Mountain3',
    'https://via.placeholder.com/300?text=Mountain4'
  ],
  0
),
(
  'running',
  array[
    'https://via.placeholder.com/300?text=Running1',
    'https://via.placeholder.com/300?text=Running2',
    'https://via.placeholder.com/300?text=Running3',
    'https://via.placeholder.com/300?text=Running4'
  ],
  0
); 