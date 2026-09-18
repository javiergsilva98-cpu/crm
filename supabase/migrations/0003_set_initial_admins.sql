-- Sube a 'admin' las dos cuentas iniciales del club: la del presidente
-- real y la cuenta demo de acceso completo. Es seguro re-ejecutar este
-- archivo (por ejemplo, tras crear la cuenta demo en /login) porque el
-- update simplemente no afecta filas si el email aún no existe.

update public.profiles set role = 'admin' where email = 'javiergsilva98@gmail.com';
update public.profiles set role = 'admin' where email = 'democlub@gmail.com';
