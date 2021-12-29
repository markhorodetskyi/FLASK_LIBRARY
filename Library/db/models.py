from sqlalchemy import Column, Integer, String, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from .base_class import Base
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin


class User(Base, UserMixin):

    __tablename__ = 'users'

    id = Column(Integer, primary_key=True)

    email = Column(String(32), unique=True, nullable=False)
    psw_hash = Column(String(128), unique=True, nullable=False)
    role = Column(Integer, ForeignKey('roles.id'), nullable=False)


    def __init__(self, email: str, psw: str, role: str) -> None:
        self.email = email
        self.psw_hash = generate_password_hash(psw)
        self.role = role

    def get_id(self) -> int:
        return self.id

    def check_psw(self, psw: str):
        return check_password_hash(self.psw_hash, psw)


class Reader(Base):

    __tablename__ = 'readers'

    id = Column(Integer, primary_key=True)
    name = Column(String(32), unique=False, nullable=False)
    surname = Column(String(32), unique=False, nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    user = relationship('User', backref='readers')

    def __init__(self, name: str, surname: str, user_id: int) -> None:
        self.name = name
        self.surname = surname
        self.user_id = user_id

    def get_id(self) -> int:
        return self.id

    def __str__(self):
        return f"Ім'я: {self.name}, Прізвище: {self.surname}"

    def check_psw(self, psw: str):
        return check_password_hash(self.psw_hash, psw)


class Roles(Base):

    __tablename__ = 'roles'

    id = Column(Integer, primary_key=True)
    role = Column(String(16), nullable=False)

    def __init__(self, role: str):
        self.role = role

    def __str__(self):
        return f'{self.role}'

class Book(Base):

    __tablename__ = 'books'

    id = Column(Integer, primary_key=True)
    title = Column(String(128), nullable=False)
    author = Column(String(64), nullable=False)
    genre = Column(String(32), nullable=False)
    year = Column(Integer, nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    user = relationship('User', backref='books')

    def __init__(self, title: str, author: str, genre: str, year: str, user_id: int = None):
        self.title = title
        self.author = author
        self.genre = genre
        self.year = year
        self.user_id = user_id

    def __str__(self):
        return f'Назва: {self.title}, Автор: {self.author}'

    def get_id(self) -> int:
        return self.id
