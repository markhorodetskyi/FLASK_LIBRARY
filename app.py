from flask import Flask, render_template, request, flash, redirect, url_for
from flask_login import LoginManager, logout_user, current_user, login_required, login_user
from Library.db.sqlite_conn import SqliteConn
from Library.library import Library
from forms import *

app = Flask(__name__, static_url_path='/static/')
app.config.from_object('config')

login_manager = LoginManager(app)
login_manager.login_view = 'api_signin'

sql_conn = SqliteConn()
library = Library(sql_conn)


@login_manager.user_loader
def load_user(user_id):
    return library.get_user_by_id(user_id)


@app.route('/signup', methods=['GET', 'POST'])
def api_signup():
    if current_user.is_authenticated:
        return redirect(url_for('home'))


    form = user_form_choice(library.get_roles())
    if request.method == 'POST':
        email = form.email.data
        psw_hash = form.psw_hash.data
        name = form.name.data
        surname = form.surname.data
        role = form.role.data

        if not (email and psw_hash and name and surname):
            flash('Введені некоректні дані', 'danger')
            return redirect(url_for('api_signup'))

        if library.get_reader_by_email(email):
            flash('Користувач з таким email вже зареєстрований', 'danger')
            return redirect(url_for('api_signup'))

        if library.add_user(name, surname, email, psw_hash, role):
            flash('Тепер можете увійти', 'success')
            return redirect(url_for('api_signin'))
        else:
            flash('Помилка', 'danger')
            return redirect(url_for('api_signup'))

    return render_template('signup.html', form=form)


@app.route('/', methods=['GET', 'POST'])
def api_signin():

    if current_user.is_authenticated:
        flash('Ви вже авторизовані', 'info')
        return redirect(url_for('home'))

    form = SigninForm()

    if request.method == 'POST':
        email = form.email.data
        psw = form.psw.data

        if not (email and psw):
            flash('Введені некоректні дані', 'danger')
            return render_template('signin.html')

        reader = library.get_reader_by_email(email)
        if reader and reader.check_psw(psw):
            login_user(reader)
            return redirect(url_for('home'))
        else:
            flash('Invalid email or password', 'danger')

    flash('Презентація вспливаючих повідомлень', 'info')
    flash('Презентація вспливаючих повідомлень', 'danger')
    flash('Презентація вспливаючих повідомлень', 'warning')
    flash('Презентація вспливаючих повідомлень', 'success')
    return render_template('signin.html', form=form)


@app.route('/home', methods=['GET', 'POST'])
@login_required
def home():
    library.load_book_from_db()
    form = AddBookForm()
    role_id = library.get_admin_role_id()
    if current_user.role == role_id.id:
        staff = True
    else:
        staff = None
    print(staff)
    data = {
        'form': form,
        'staff': staff,
        'books': sorted(library.show_book(), key=lambda book: book.id),
        'my_books': sorted(library.get_book_by_user_id(current_user.id), key=lambda book: book.id)
    }
    if request.method == 'POST':
        title_book = form.title.data
        author_book = form.author.data
        year_book = form.year.data
        genre = form.genre.data
        if not (title_book and author_book and year_book and genre):
            flash('Введені некоректні дані', 'danger')
            return redirect(url_for('home'))
        ret_code, ret_msg = library.add_book(title_book, author_book, genre, int(year_book))
        flash(ret_msg, ret_code)
        return redirect(url_for('home'))

    return render_template('home.html', data=data)

@app.route('/delBook')
@login_required
def api_del_book():
    role_id = library.get_admin_role_id()
    if current_user.role != role_id.id:
        flash('У Вас немає для цього прав!')
        return redirect(url_for('home'))
    book_id = request.args.get('book_id')
    ret_code, ret_msg = library.del_book(book_id)
    flash(ret_msg, ret_code)
    return redirect(url_for('home'))


@app.route('/take_book')
@login_required
def api_take_book():
    book_id = request.args.get('book_id')
    ret_code, ret_msg = library.give_book(book_id, current_user.id)
    flash(ret_msg, ret_code)
    return redirect(url_for('home'))


@app.route('/return_book')
@login_required
def api_return_book():
    book_id = request.args.get('book_id')
    book = library.get_book_by_id(book_id)
    if current_user.id == book.user_id:
        ret_code, ret_msg = library.return_book(book)
        flash(ret_msg, ret_code)
        return redirect(url_for('home'))
    else:
        flash('Книга знаходиться не у Вас!', 'warning')
        return redirect(url_for('home'))


@app.route('/edit_book', methods=['GET', 'POST'])
@login_required
def api_edit_book():
    role_id = library.get_admin_role_id()
    if current_user.role != role_id.id:
        flash('У Вас немає для цього прав!')
        return redirect(url_for('home'))
    book_id = request.args.get('book_id')
    form = AddBookForm()
    book = library.get_book_by_id(str(book_id))
    data = {
        'form': form,
        'book': library.get_book_by_id(book_id)
    }
    if request.method == 'POST':
        title_book = form.title.data
        author_book = form.author.data
        year_book = form.year.data
        genre = form.genre.data
        if not (title_book and author_book and year_book and genre):
            flash('Введені некоректні дані', 'warning')
            return redirect(url_for('api_edit_book'))
        book.title = title_book
        book.author = author_book
        book.genre = genre
        book.year = int(year_book)
        ret_code, ret_msg = library.edit_book(book)
        flash(ret_msg, ret_code)
        return redirect(url_for('home'))
    return render_template('forms.html', data=data)


@app.route('/users', methods=['GET', 'POST'])
@login_required
def api_users():
    library.load_user_from_db()
    data = {
        'users': sorted(library.show_user(), key=lambda user: user.id)
    }
    return render_template('users.html', data=data)


@app.route('/delUser')
@login_required
def api_del_user():
    role_id = library.get_admin_role_id()
    if current_user.role != role_id.id:
        flash('У Вас немає для цього прав!')
        return redirect(url_for('api_users'))

    user_id = request.args.get('user_id')
    ret_code, ret_msg = library.del_user(user_id)
    flash(ret_msg, ret_code)
    return redirect(url_for('api_users'))


@app.route('/logout', methods=['GET'])
@login_required
def api_logout():
    logout_user()
    return redirect(url_for('api_signin'))


if __name__ == '__main__':
    app.run()
