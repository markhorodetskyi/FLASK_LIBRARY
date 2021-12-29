from abc import abstractmethod, ABC
from .models import User, Book, Reader


class Connector(ABC):

    @abstractmethod
    def get_books(self):
        pass

    @abstractmethod
    def get_users(self):
        pass

    @abstractmethod
    def load_readers_by_email(self, email: str) -> User:
        pass

    @abstractmethod
    def load_user_by_id(self, id_: int) -> User:
        pass

    @abstractmethod
    def load_reader_by_id(self, id_: int) -> Reader:
        pass

    @abstractmethod
    def add_book(self, obj_book: Book) -> bool:
        pass

    @abstractmethod
    def add_user(self, obj_user: User) -> bool:
        pass
