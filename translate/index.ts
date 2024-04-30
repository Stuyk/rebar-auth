import { useTranslate } from '../../../main/shared/translate.js';
const { setBulk } = useTranslate();

setBulk({
    en: {
        'auth.span.login': 'Login',
        'auth.span.register': 'Register',
        'auth.span.remember': 'Remember',
        'auth.span.bad.password': 'Email or password is incorrect',
        'auth.span.register.error': 'Something went wrong, try again',
        'auth.span.email': 'email',
        'auth.span.password': 'password',
        'auth.span.password.again': 'password again',
        'auth.span.new.user': 'New User?',
        'auth.span.existing.user': 'Existing User?',
    },
});
