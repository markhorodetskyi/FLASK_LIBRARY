from .db.models import *


class Library:
    def __init__(self, db):
        self.books = None
        self.readers = None
        self.db = db
        self.last_book_id = None
        self.last_user_id = None

    def __str__(self):
        return ''.join(f'{book} \n' for book in self.books)

    @staticmethod
    def menu():
        return ['1. Добавити книгу(add, a)',
                '2. Видалити книгу(del, d)',
                '3. Відредагувати книгу(edit, e)',
                '4. Добавити читача(addU, au)',
                '5. Показати книги(sb)',
                '6. Показати читачів(su)',
                'Будь ласка введіть номер 1 - 6, або "end(enter)" для завершення програми: ']

    def load_book_from_db(self):
        self.books = self.db.get_books()

    def load_user_from_db(self):
        self.readers = self.db.get_users()
        for reader in self.readers:
            print(reader.readers[0].name, reader.readers[0].surname)

    def add_book(self, title, author, genre, year):
        book = Book(
            title=title,
            author=author,
            genre=genre,
            year=year,
            user_id=None)
        if self.db.add_book(book):
            return 'success', 'Книга успішно додана до бібліотеки'
        else:
            return 'danger', 'Помилка'

    def del_book(self, book_id):
        book = self.get_book_by_id(book_id)
        if self.db.del_book(book):
            return 'success', 'Книга успішно видалена з бібліотеки'
        else:
            return 'danger', 'Помилка'

    def give_book(self, book_id, user_id):
        book = self.get_book_by_id(book_id)
        if self.db.give_book(book, user_id):
            return 'success', 'Книга успішно видана'
        else:
            return 'danger', 'Помилка'

    def return_book(self, book_obj: Book):
        if self.db.return_book(book_obj):
            return 'success', 'Книга успішно повернулась у бібліотеку'
        else:
            return 'danger', 'Помилка'

    def edit_book(self, book_obj: Book):
        if self.db.edit_book(book_obj):
            return 'success', 'Книга успішно відредагована'
        else:
            return 'danger', 'Помилка'

    def add_user(self, name, surname, email, psw, role,):
        user = User(
            email=email,
            psw=psw,
            role=role
        )
        if self.db.add_user(user):
            reader = Reader(
                name=name,
                surname=surname,
                user_id=user.id
            )
            if self.db.add_reader(reader):
                return 'success', 'Ви спішно зареєструвались'
        else:
            return 'danger', 'Помилка'

    def del_user(self, user_id):
        user = self.get_user_by_id(user_id)
        if not self.db.del_reader(user.readers[0]):
            return 'danger', 'Помилка'
        if not self.db.del_user(user):
            return 'danger', 'Помилка'
        return 'success', 'Користувач успішно видалений з бібліотеки'

    def get_last_book_id(self):
        self.last_book_id = max([book.id for book in self.books]) if self.books else 0
        return self.last_book_id

    def get_last_user_id(self):
        self.last_user_id = max([reader.id for reader in self.readers]) if self.readers else 0
        return self.last_user_id

    def show_book(self):
        return self.books

    def show_user(self):
        return self.readers

    def get_book_by_id(self, id_: int) -> Book:
        return self.db.load_book_by_id(id_)

    def get_reader_role_id(self,) -> Roles:
        return self.db.load_reader_role_id()

    def get_roles(self, ) -> list:
        roles = self.db.load_roles()
        choices = list()
        for role in roles:
            choices.append((role.id, role.role))
        return choices

    def get_admin_role_id(self,) -> Roles:
        return self.db.load_admin_role_id()

    def get_book_by_user_id(self, id_: int) -> Book:
        return self.db.load_book_by_user_id(id_)

    def get_user_by_id(self, id_: int) -> User:
        return self.db.load_user_by_id(id_)

    def get_reader_by_email(self, email: str) -> User:
        return self.db.load_readers_by_email(email)