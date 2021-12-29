from flask_wtf import FlaskForm
from Library.db.models import *
from wtforms import StringField, IntegerField, SubmitField, SelectField, EmailField, PasswordField
from wtforms.validators import DataRequired, NumberRange, Email

GENRE = [
    'Romance',
    'Fantastic',
    'Fantasy',
    'Scince',
    'Epic poems'
]


class AddBookForm(FlaskForm):
    title = StringField('Title', name='title', id='title', validators=[DataRequired()])
    author = StringField('Author', name='author', id='author', validators=[DataRequired()])
    genre = SelectField('Genre', name='genre', id='genre', validators=[DataRequired()], choices=GENRE)
    year = IntegerField('Year', name='year', id='year', validators=[DataRequired(), NumberRange()])


class AddUserForm(FlaskForm):
    name = StringField('Name', name='name', id='name', validators=[DataRequired()])
    surname = StringField('Surname', name='surname', id='surname', validators=[DataRequired()])
    email = EmailField('Email', name='email', id='email', validators=[DataRequired(), Email()])
    psw_hash = PasswordField('Psw', name='psw_hash', id='psw_hash', validators=[DataRequired()])


def user_form_choice(role_list):
    add_user_form = AddUserForm
    add_user_form.role = SelectField('Role', name='role', id='role', validators=[DataRequired()], choices=role_list)
    return add_user_form()


class SigninForm(FlaskForm):
    email = EmailField('Email', name='email', id='email', validators=[DataRequired(), Email()])
    psw = PasswordField('Psw', name='psw', id='psw', validators=[DataRequired()])
