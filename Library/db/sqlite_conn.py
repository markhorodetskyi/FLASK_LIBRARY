from .connectorDB import Connector
# from .base_class import Base
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from .models import *


class SqliteConn(Connector):
    __DB_LOCATION = "///Library/db/library_db"
    TYPE = 'sqlite'

    def __init__(self, db_location=None):
        if db_location is not None:
            self.engine = create_engine(
                "mysql+pymysql://test_user:blaTest0!#@109.207.113.154:3307/library?charset=utf8mb4")
        else:
            # self.engine = create_engine(f'sqlite:{self.__DB_LOCATION}', echo=True)
            self.engine = create_engine(
                "mysql+pymysql://test_user:blaTest0!#@109.207.113.154:3307/library?charset=utf8mb4")
            # self.engine = create_engine('postgresql://postgres:testPsw@localhost:5432/postgres', echo=True)
        Base.metadata.create_all(self.engine)
        self.__session = Session(bind=self.engine)

    def get_books(self):
        return self.__session.query(Book).all()

    def get_users(self):
        return self.__session.query(User).all()

    def load_book_by_id(self, id_: int) -> Book:
        return self.__session.query(Book).filter_by(id=id_).first()

    def load_reader_role_id(self) -> Roles:
        return self.__session.query(Roles).filter_by(role='reader').first()

    def load_roles(self) -> list:
        return self.__session.query(Roles).all()

    def load_admin_role_id(self) -> Roles:
        return self.__session.query(Roles).filter_by(role='staff').first()

    def load_book_by_user_id(self, id_: int) -> Book:
        return self.__session.query(Book).filter_by(user_id=id_).all()

    def load_readers_by_email(self, email: str) -> User:
        return self.__session.query(User).filter_by(email=email).first()

    def load_user_by_id(self, id_: int) -> User:
        return self.__session.query(User).filter_by(id=id_).first()

    def load_reader_by_id(self, id_: int) -> Reader:
        return self.__session.query(Reader).filter_by(id=id_).first()

    def add_book(self, obj_book: Book) -> bool:
        self.__session.add(obj_book)
        try:
            self.__session.commit()
        except Exception as e:
            print(e)
            return False
        return True

    def del_book(self, obj_book: Book) -> bool:
        self.__session.delete(obj_book)
        try:
            self.__session.commit()
        except Exception as e:
            self.__session.rollback()
            print(e)
            return False
        return True

    def add_user(self, obj_user: User) -> bool:
        self.__session.add(obj_user)
        try:
            self.__session.commit()
        except Exception as e:
            self.__session.rollback()
            print(e)
            return False
        return True

    def add_reader(self, obj_reader: Reader) -> bool:
        self.__session.add(obj_reader)
        try:
            self.__session.commit()
        except Exception as e:
            self.__session.rollback()
            print(e)
            return False
        return True

    def del_user(self, obj_user: User) -> bool:
        self.__session.delete(obj_user)
        try:
            self.__session.commit()
        except Exception as e:
            self.__session.rollback()
            print(e)
            return False
        return True

    def del_reader(self, obj_reader: Reader) -> bool:
        self.__session.delete(obj_reader)
        try:
            self.__session.commit()
        except Exception as e:
            self.__session.rollback()
            print(e)
            return False
        return True

    def edit_book(self, obj_book: Book) -> bool:
        self.__session.query(Book).filter_by(id=obj_book.id).update({
            Book.title: obj_book.title,
            Book.author: obj_book.author,
            Book.genre: obj_book.genre,
            Book.year: obj_book.year
        })
        try:
            self.__session.commit()
        except Exception as e:
            self.__session.rollback()
            print(e)
            return False
        return True

    def give_book(self, obj_book: Book, user_id) -> bool:
        self.__session.query(Book).filter_by(id=obj_book.id).update({Book.user_id: user_id})
        try:
            self.__session.commit()
        except Exception as e:
            self.__session.rollback()
            print(e)
            return False
        return True

    def return_book(self, obj_book: Book) -> bool:
        self.__session.query(Book).filter_by(id=obj_book.id).update({Book.user_id: None})
        try:
            self.__session.commit()
        except Exception as e:
            self.__session.rollback()
            print(e)
            return False
        return True
