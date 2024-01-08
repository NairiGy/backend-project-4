### Hexlet tests and linter status:
[![hexlet-check](https://github.com/NairiGy/backend-project-4/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/NairiGy/backend-project-4/actions/workflows/hexlet-check.yml)
[![Maintainability](https://api.codeclimate.com/v1/badges/afe6bc2e3700e501a295/maintainability)](https://codeclimate.com/github/NairiGy/backend-project-4/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/afe6bc2e3700e501a295/test_coverage)](https://codeclimate.com/github/NairiGy/backend-project-4/test_coverage)

[Ссылка с примером](https://asciinema.org/a/s1F6GRMvv4fnAdtiqQxDyDG42)

### Page loader

PageLoader – утилита командной строки, которая скачивает страницы из интернета и сохраняет их на компьютере. Вместе со страницей она скачивает все ресурсы (картинки, стили и js) давая возможность открывать страницу без интернета.

Утилита скачивает ресурсы параллельно и показывает прогресс по каждому ресурсу в терминале

Пример использования:

```
page-loader --output /var/tmp https://ru.hexlet.io/courses

✔ https://ru.hexlet.io/lessons.rss
✔ https://ru.hexlet.io/assets/application.css
✔ https://ru.hexlet.io/assets/favicon.ico
✔ https://ru.hexlet.io/assets/favicon-196x196.png
✔ https://ru.hexlet.io/assets/favicon-96x96.png
✔ https://ru.hexlet.io/assets/favicon-32x32.png
✔ https://ru.hexlet.io/assets/favicon-16x16.png
✔ https://ru.hexlet.io/assets/favicon-128.png

Page was downloaded as 'ru-hexlet-io-courses.html'

```


### Установка

        git clone git@github.com:NairiGy/backend-project-4.git
        make install