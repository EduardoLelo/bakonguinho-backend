const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
dconst app = express();

const PORT =
    Number(process.env.PORT || 3000);

const ROOT =
    __dirname;

const PUBLIC =
    path.join(ROOT, 'public');

const DATA_DIR =
    process.env.DATA_DIR ||
    path.join(ROOT, 'data');

const DB_PATH =
    process.env.DB_PATH ||
    path.join(DATA_DIR, 'bakonguinho.db');

const UPLOADS =
    process.env.UPLOADS_DIR ||
    path.join(DATA_DIR, 'uploads');

const NODE_ENV =
    process.env.NODE_ENV ||
    'development';

const SESSION_SECRET =
    process.env.SESSION_SECRET;

const ADMIN_EMAIL =
    process.env.ADMIN_EMAIL ||
    'admin@bakonguinho.ao';

const ADMIN_PASSWORD =
    process.env.ADMIN_PASSWORD;


/* =========================================================
   VERIFICAÇÃO DE PRODUÇÃO
   ========================================================= */

if (
    NODE_ENV === 'production' &&
    (!SESSION_SECRET || !ADMIN_PASSWORD)
) {
    console.error(
        'ERRO: defina SESSION_SECRET e ADMIN_PASSWORD nas variáveis de ambiente.'
    );

    process.exit(1);
}


/* =========================================================
   PASTAS E BASE DE DADOS
   ========================================================= */

fs.mkdirSync(
    path.dirname(DB_PATH),
    {
        recursive: true
    }
);

fs.mkdirSync(
    UPLOADS,
    {
        recursive: true
    }
);


const db =
    new Database(DB_PATH);


// Ativar WAL
db.pragma('journal_mode = WAL');


// Ativar chaves estrangeiras
db.pragma('foreign_keys = ON');


/* =========================================================
   TABELAS
   ========================================================= */

db.exec(`
    CREATE TABLE IF NOT EXISTS admins(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL DEFAULT 0,
        image TEXT,
        featured INTEGER DEFAULT 0,
        active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(category_id)
            REFERENCES categories(id)
            ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS gallery(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        caption TEXT NOT NULL,
        image TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reviews(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        comment TEXT NOT NULL,
        rating INTEGER NOT NULL DEFAULT 5,
        active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings(
        id INTEGER PRIMARY KEY,
        hero_title TEXT,
        hero_text TEXT,
        about_text TEXT,
        address TEXT,
        phone TEXT,
        hours TEXT,
        maps_url TEXT,
        review_count INTEGER DEFAULT 0
    );
`);


/* =========================================================
   FUNÇÃO SEED
   ========================================================= */

function seed() {

    /* -------------------------------------------------------
       Administrador
       ------------------------------------------------------- */

    const admin =
        db
            .prepare(
                'SELECT id FROM admins LIMIT 1'
            )
            .get();


    if (!admin) {

        const password =
            ADMIN_PASSWORD || '123456';


        const hash =
            bcrypt.hashSync(
                password,
                12
            );


        db
            .prepare(
                'INSERT INTO admins(name,email,password) VALUES(?,?,?)'
            )
            .run(
                'Administrador',
                ADMIN_EMAIL,
                hash
            );


        if (
            NODE_ENV !== 'production'
        ) {

            console.log(
                `Admin inicial: ${ADMIN_EMAIL} / ${password}`
            );
        }
    }


    /* -------------------------------------------------------
       Categorias
       ------------------------------------------------------- */

    const categories = [
        'Hambúrgueres',
        'Churrasco',
        'Acompanhamentos',
        'Bebidas',
        'Especiais'
    ];


    const insertCategory =
        db.prepare(
            'INSERT OR IGNORE INTO categories(name) VALUES(?)'
        );


    categories.forEach(
        (category) => {
            insertCategory.run(
                category
            );
        }
    );


    /* -------------------------------------------------------
       Configurações
       ------------------------------------------------------- */

    if (
        !db
            .prepare(
                'SELECT id FROM settings WHERE id=1'
            )
            .get()
    ) {

        db.prepare(`
            INSERT INTO settings
            VALUES(1,?,?,?,?,?,?,?,?)
        `).run(
            'O sabor que dá vontade de voltar',

            'Hambúrgueres preparados com sabor, qualidade e aquele toque especial da BAKONGUINHO.',

            'A BAKONGUINHO é uma hamburgueria pensada para quem aprecia boa comida, hambúrgueres saborosos e momentos especiais.',

            'Seleque - Maye Maye, quadra E, Sequele, Icolo Bengo, Angola',

            '923 850 875',

            'Aberto até às 22:00',

            'https://www.google.com/maps/place/Hamburguer+BAKONGUINHO/@-8.8938364,13.5157143,285m/data=!3m1!1e3!4m5!3m4!1s0x1a51ff943b54e54b:0x81f5bb624b697ee3!8m2!3d-8.8939491!4d13.5157987?entry=ttu&g_ep=EgoyMDI2MDkwOS4wIKXMDSoASAFQAw%3D%3D',

            0
        );
    }


    /* -------------------------------------------------------
       Produtos iniciais
       ------------------------------------------------------- */

    if (
        db
            .prepare(
                'SELECT COUNT(*) c FROM products'
            )
            .get().c === 0
    ) {

        const categoryIds = {};


        db
            .prepare(
                'SELECT * FROM categories'
            )
            .all()
            .forEach(
                (category) => {

                    categoryIds[
                        category.name
                    ] = category.id;
                }
            );


        const insertProduct =
            db.prepare(`
                INSERT INTO products(
                    category_id,
                    name,
                    description,
                    price,
                    image,
                    featured,
                    active
                )
                VALUES(?,?,?,?,?,?,?)
            `);


        insertProduct.run(
            categoryIds['Hambúrgueres'],
            'Double Cheeseburger',
            'Hambúrguer duplo artesanal.',
            2500,
            'assets/images/produto_20260911_153446_04612a9283.jpg',
            1,
            1
        );


        insertProduct.run(
            categoryIds['Hambúrgueres'],
            'Crispy Chicken',
            'Frango crocante num pão brioche.',
            2200,
            'assets/images/produto_20260911_153558_482ad29e45.jpg',
            1,
            1
        );


        insertProduct.run(
            categoryIds['Hambúrgueres'],
            'Bacon Gourmet',
            'Hambúrguer gourmet com queijo e bacon.',
            2800,
            'assets/images/produto_20260911_155619_7b9b217736.jpg',
            1,
            1
        );


        insertProduct.run(
            categoryIds['Churrasco'],
            'No nosso churrasco',
            'Especialidade preparada na brasa.',
            3500,
            'assets/images/produto_20260911_161351_5d26f0bdb1.jpg',
            1,
            1
        );


        insertProduct.run(
            categoryIds['Especiais'],
            'Smash Sliders',
            'Mini hambúrgueres smash.',
            2000,
            'assets/images/bakonguinho.jfif',
            0,
            1
        );


        insertProduct.run(
            categoryIds['Especiais'],
            'Cheeseburger Clássica',
            'Receita clássica americana.',
            2000,
            'assets/images/bakonguinho2.jfif',
            0,
            1
        );
    }


    /* -------------------------------------------------------
       IMPORTANTE:
       Não criar avaliação fictícia automaticamente.
       ------------------------------------------------------- */
}


seed();


/* =========================================================
   SEGURANÇA
   ========================================================= */

app.disable(
    'x-powered-by'
);

app.set(
    'trust proxy',
    1
);


app.use(
    (req, res, next) => {

        res.setHeader(
            'X-Content-Type-Options',
            'nosniff'
        );


        res.setHeader(
            'Referrer-Policy',
            'strict-origin-when-cross-origin'
        );


        res.setHeader(
            'X-Frame-Options',
            'SAMEORIGIN'
        );


        next();
    }
);


/* =========================================================
   BODY PARSER
   ========================================================= */

app.use(
    express.json({
        limit: '2mb'
    })
);


app.use(
    express.urlencoded({
        extended: true
    })
);


/* =========================================================
   CORS
   ========================================================= */

const allowedOrigin =
    process.env.ALLOWED_ORIGIN;


app.use(
    (req, res, next) => {

        if (allowedOrigin) {

            res.setHeader(
                'Access-Control-Allow-Origin',
                allowedOrigin
            );


            res.setHeader(
                'Access-Control-Allow-Credentials',
                'true'
            );


            res.setHeader(
                'Access-Control-Allow-Headers',
                'Content-Type'
            );


            res.setHeader(
                'Access-Control-Allow-Methods',
                'GET,POST,PUT,PATCH,DELETE,OPTIONS'
            );
        }


        if (
            req.method === 'OPTIONS'
        ) {

            return res.sendStatus(
                204
            );
        }


        next();
    }
);


/* =========================================================
   SESSÃO
   ========================================================= */

app.use(
    session({
        secret:
            SESSION_SECRET ||
            'dev-only-change-this-secret',

        resave:
            false,

        saveUninitialized:
            false,

        cookie: {

            httpOnly:
                true,

            sameSite:
                'lax',

            secure:
                NODE_ENV === 'production',

            maxAge:
                1000 *
                60 *
                60 *
                8
        }
    })
);


/* =========================================================
   FICHEIROS
   ========================================================= */

app.use(
    '/uploads',
    express.static(
        UPLOADS,
        {
            maxAge: '7d'
        }
    )
);


app.use(
    express.static(
        PUBLIC
    )
);


/* =========================================================
   UPLOADS
   ========================================================= */

const imageFilter =
    (req, file, cb) => {

        cb(
            null,
            /^(image\/jpeg|image\/png|image\/webp)$/.test(
                file.mimetype
            )
        );
    };


const makeStorage =
    (prefix) =>
        multer.diskStorage({

            destination:
                (req, file, cb) =>

                    cb(
                        null,
                        UPLOADS
                    ),


            filename:
                (req, file, cb) =>

                    cb(
                        null,
                        `${prefix}_${Date.now()}_${Math.random()
                            .toString(36)
                            .slice(2, 8)}${path
                            .extname(
                                file.originalname
                            )
                            .toLowerCase()}`
                    )
        });


const upload =
    multer({
        storage:
            makeStorage('produto'),

        limits: {
            fileSize:
                5 * 1024 * 1024
        },

        fileFilter:
            imageFilter
    });


const gUpload =
    multer({
        storage:
            makeStorage('gallery'),

        limits: {
            fileSize:
                5 * 1024 * 1024
        },

        fileFilter:
            imageFilter
    });


/* =========================================================
   AUTENTICAÇÃO
   ========================================================= */

function auth(
    req,
    res,
    next
) {

    if (
        !req.session.adminId
    ) {

        return res
            .status(401)
            .json({
                error:
                    'Não autenticado'
            });
    }


    next();
}


/* =========================================================
   FUNÇÕES AUXILIARES
   ========================================================= */

function clean(value) {

    return String(
        value ?? ''
    ).trim();
}


function removeUpload(
    image
) {

    if (
        !image ||
        !image.startsWith(
            'uploads/'
        )
    ) {

        return;
    }


    const file =
        path.join(
            UPLOADS,
            image.slice(
                'uploads/'.length
            )
        );


    if (
        fs.existsSync(file)
    ) {

        fs.unlinkSync(
            file
        );
    }
}


/* =========================================================
   HEALTH CHECK
   ========================================================= */

app.get(
    '/health',
    (req, res) => {

        res.json({
            ok: true,
            service:
                'bakonguinho-api'
        });
    }
);


/* =========================================================
   LOGIN
   ========================================================= */

app.post(
    '/api/login',
    (req, res) => {

        const admin =
            db
                .prepare(
                    'SELECT * FROM admins WHERE email=?'
                )
                .get(
                    clean(
                        req.body.email
                    )
                );


        if (
            !admin ||
            !bcrypt.compareSync(
                req.body.password || '',
                admin.password
            )
        ) {

            return res
                .status(401)
                .json({
                    error:
                        'E-mail ou palavra-passe inválidos.'
                });
        }


        req.session.adminId =
            admin.id;

        req.session.adminName =
            admin.name;


        res.json({
            name:
                admin.name
        });
    }
);


/* =========================================================
   LOGOUT
   ========================================================= */

app.post(
    '/api/logout',
    (req, res) => {

        req.session.destroy(
            () => {

                res.json({
                    ok: true
                });
            }
        );
    }
);


/* =========================================================
   UTILIZADOR ADMINISTRADOR
   ========================================================= */

app.get(
    '/api/me',
    (req, res) => {

        res.json(
            req.session.adminId

                ? {
                    authenticated:
                        true,

                    name:
                        req.session.adminName
                }

                : {
                    authenticated:
                        false
                }
        );
    }
);


/* =========================================================
   API PÚBLICA DO SITE
   ========================================================= */

app.get(
    '/api/site',
    (req, res) => {

        const settings =
            db
                .prepare(
                    'SELECT * FROM settings WHERE id=1'
                )
                .get();


        const categories =
            db
                .prepare(
                    'SELECT * FROM categories ORDER BY name'
                )
                .all();


        const products =
            db
                .prepare(`
                    SELECT
                        p.*,
                        c.name category_name
                    FROM products p

                    LEFT JOIN categories c
                        ON c.id = p.category_id

                    WHERE p.active = 1

                    ORDER BY
                        p.featured DESC,
                        p.id DESC
                `)
                .all();


        const gallery =
            db
                .prepare(
                    'SELECT * FROM gallery ORDER BY id DESC LIMIT 8'
                )
                .all();


        const reviews =
            db
                .prepare(`
                    SELECT *
                    FROM reviews
                    WHERE active = 1
                    ORDER BY id DESC
                    LIMIT 6
                `)
                .all();


        // Contagem real das avaliações aprovadas
        const approvedReviewCount =
            db
                .prepare(`
                    SELECT COUNT(*) c
                    FROM reviews
                    WHERE active = 1
                `)
                .get().c;


        // Usar a contagem real no retorno
        if (settings) {
            settings.review_count =
                approvedReviewCount;
        }


        res.json({
            settings,
            categories,
            products,
            gallery,
            reviews
        });
    }
);


/* =========================================================
   NOVA AVALIAÇÃO PÚBLICA
   ---------------------------------------------------------
   Qualquer cliente pode enviar.
   A avaliação começa com active = 0.
   ========================================================= */

app.post(
    '/api/reviews',
    (req, res) => {

        /* ---------------------------------------------------
           Dados recebidos
           --------------------------------------------------- */

        const name =
            clean(
                req.body.name
            );


        const comment =
            clean(
                req.body.comment
            );


        const rating =
            Number(
                req.body.rating || 5
            );


        /* ---------------------------------------------------
           Validar nome
           --------------------------------------------------- */

        if (!name) {

            return res
                .status(400)
                .json({
                    error:
                        'Informe o seu nome.'
                });
        }


        /* ---------------------------------------------------
           Validar comentário
           --------------------------------------------------- */

        if (!comment) {

            return res
                .status(400)
                .json({
                    error:
                        'Escreva o seu comentário.'
                });
        }


        /* ---------------------------------------------------
           Validar tamanho do nome
           --------------------------------------------------- */

        if (
            name.length > 100
        ) {

            return res
                .status(400)
                .json({
                    error:
                        'O nome é demasiado longo.'
                });
        }


        /* ---------------------------------------------------
           Validar tamanho do comentário
           --------------------------------------------------- */

        if (
            comment.length > 1000
        ) {

            return res
                .status(400)
                .json({
                    error:
                        'O comentário é demasiado longo.'
                });
        }


        /* ---------------------------------------------------
           Validar estrelas
           --------------------------------------------------- */

        if (
            !Number.isInteger(
                rating
            ) ||
            rating < 1 ||
            rating > 5
        ) {

            return res
                .status(400)
                .json({
                    error:
                        'A avaliação deve estar entre 1 e 5 estrelas.'
                });
        }


        try {

            /* -----------------------------------------------
               Inserir como pendente

               active = 0
               ----------------------------------------------- */

            db.prepare(`
                INSERT INTO reviews(
                    name,
                    comment,
                    rating,
                    active
                )
                VALUES(?,?,?,0)
            `).run(
                name,
                comment,
                rating
            );


            /* -----------------------------------------------
               Resposta
               ----------------------------------------------- */

            res
                .status(201)
                .json({
                    ok: true,

                    message:
                        'Avaliação enviada e aguardando aprovação.'
                });


        } catch (error) {

            console.error(
                'Erro ao guardar avaliação:',
                error
            );


            res
                .status(500)
                .json({
                    error:
                        'Não foi possível enviar a avaliação.'
                });
        }
    }
);


/* =========================================================
   ESTATÍSTICAS ADMINISTRATIVAS
   ========================================================= */

app.get(
    '/api/admin/stats',
    auth,
    (req, res) => {

        res.json({

            products:
                db
                    .prepare(
                        'SELECT COUNT(*) c FROM products'
                    )
                    .get().c,

            categories:
                db
                    .prepare(
                        'SELECT COUNT(*) c FROM categories'
                    )
                    .get().c,

            reviews:
                db
                    .prepare(
                        'SELECT COUNT(*) c FROM reviews'
                    )
                    .get().c,

            gallery:
                db
                    .prepare(
                        'SELECT COUNT(*) c FROM gallery'
                    )
                    .get().c
        });
    }
);


/* =========================================================
   PRODUTOS - ADMIN
   ========================================================= */

app.get(
    '/api/admin/products',
    auth,
    (req, res) => {

        res.json(
            db
                .prepare(`
                    SELECT
                        p.*,
                        c.name category_name
                    FROM products p

                    LEFT JOIN categories c
                        ON c.id = p.category_id

                    ORDER BY p.id DESC
                `)
                .all()
        );
    }
);


app.post(
    '/api/admin/products',
    auth,
    upload.single('image'),
    (req, res) => {

        const id =
            Number(
                req.body.id || 0
            );


        const name =
            clean(
                req.body.name
            );


        const description =
            clean(
                req.body.description
            );


        const price =
            Number(
                req.body.price || 0
            );


        const category =
            Number(
                req.body.category_id || 0
            );


        if (
            !name ||
            !Number.isFinite(price) ||
            price < 0 ||
            !category
        ) {

            return res
                .status(400)
                .json({
                    error:
                        'Preencha nome, preço e categoria.'
                });
        }


        try {

            if (id) {

                const old =
                    db
                        .prepare(
                            'SELECT image FROM products WHERE id=?'
                        )
                        .get(id);


                if (!old) {

                    return res
                        .status(404)
                        .json({
                            error:
                                'Produto não encontrado'
                        });
                }


                let image =
                    old.image;


                if (
                    req.file
                ) {

                    image =
                        'uploads/' +
                        req.file.filename;


                    removeUpload(
                        old.image
                    );
                }


                db
                    .prepare(`
                        UPDATE products
                        SET
                            category_id=?,
                            name=?,
                            description=?,
                            price=?,
                            image=?,
                            featured=?,
                            active=?
                        WHERE id=?
                    `)
                    .run(
                        category,
                        name,
                        description,
                        price,
                        image,
                        req.body.featured === '1'
                            ? 1
                            : 0,
                        req.body.active === '1'
                            ? 1
                            : 0,
                        id
                    );

            } else {

                const image =
                    req.file
                        ? 'uploads/' +
                          req.file.filename
                        : '';


                db
                    .prepare(`
                        INSERT INTO products(
                            category_id,
                            name,
                            description,
                            price,
                            image,
                            featured,
                            active
                        )
                        VALUES(?,?,?,?,?,?,?)
                    `)
                    .run(
                        category,
                        name,
                        description,
                        price,
                        image,
                        req.body.featured === '1'
                            ? 1
                            : 0,
                        req.body.active === '1'
                            ? 1
                            : 0
                    );
            }


            res.json({
                ok: true
            });

        } catch (error) {

            if (
                req.file
            ) {

                removeUpload(
                    'uploads/' +
                    req.file.filename
                );
            }


            res
                .status(500)
                .json({
                    error:
                        'Não foi possível guardar o produto.'
                });
        }
    }
);


app.delete(
    '/api/admin/products/:id',
    auth,
    (req, res) => {

        const product =
            db
                .prepare(
                    'SELECT image FROM products WHERE id=?'
                )
                .get(
                    req.params.id
                );


        if (product) {

            db
                .prepare(
                    'DELETE FROM products WHERE id=?'
                )
                .run(
                    req.params.id
                );


            removeUpload(
                product.image
            );
        }


        res.json({
            ok: true
        });
    }
);


/* =========================================================
   CATEGORIAS - ADMIN
   ========================================================= */

app.get(
    '/api/admin/categories',
    auth,
    (req, res) => {

        res.json(
            db
                .prepare(
                    'SELECT * FROM categories ORDER BY name'
                )
                .all()
        );
    }
);


app.post(
    '/api/admin/categories',
    auth,
    (req, res) => {

        const id =
            Number(
                req.body.id || 0
            );


        const name =
            clean(
                req.body.name
            );


        if (!name) {

            return res
                .status(400)
                .json({
                    error:
                        'Informe o nome.'
                });
        }


        try {

            if (id) {

                db
                    .prepare(
                        'UPDATE categories SET name=? WHERE id=?'
                    )
                    .run(
                        name,
                        id
                    );

            } else {

                db
                    .prepare(
                        'INSERT INTO categories(name) VALUES(?)'
                    )
                    .run(
                        name
                    );
            }


            res.json({
                ok: true
            });

        } catch (error) {

            res
                .status(400)
                .json({
                    error:
                        'Esta categoria já existe.'
                });
        }
    }
);


app.delete(
    '/api/admin/categories/:id',
    auth,
    (req, res) => {

        db
            .prepare(
                'DELETE FROM categories WHERE id=?'
            )
            .run(
                req.params.id
            );


        res.json({
            ok: true
        });
    }
);


/* =========================================================
   AVALIAÇÕES - ADMIN
   ========================================================= */

app.get(
    '/api/admin/reviews',
    auth,
    (req, res) => {

        res.json(
            db
                .prepare(`
                    SELECT *
                    FROM reviews
                    ORDER BY id DESC
                `)
                .all()
        );
    }
);


app.post(
    '/api/admin/reviews',
    auth,
    (req, res) => {

        const id =
            Number(
                req.body.id || 0
            );


        const name =
            clean(
                req.body.name
            );


        const comment =
            clean(
                req.body.comment
            );


        const rating =
            Math.max(
                1,
                Math.min(
                    5,
                    Number(
                        req.body.rating || 5
                    )
                )
            );


        const active =
            req.body.active === '0'
                ? 0
                : 1;


        if (
            !name ||
            !comment
        ) {

            return res
                .status(400)
                .json({
                    error:
                        'Preencha nome e comentário.'
                });
        }


        if (
            id
        ) {

            db
                .prepare(`
                    UPDATE reviews
                    SET
                        name=?,
                        comment=?,
                        rating=?,
                        active=?
                    WHERE id=?
                `)
                .run(
                    name,
                    comment,
                    rating,
                    active,
                    id
                );

        } else {

            db
                .prepare(`
                    INSERT INTO reviews(
                        name,
                        comment,
                        rating,
                        active
                    )
                    VALUES(?,?,?,?)
                `)
                .run(
                    name,
                    comment,
                    rating,
                    active
                );
        }


        res.json({
            ok: true
        });
    }
);


app.delete(
    '/api/admin/reviews/:id',
    auth,
    (req, res) => {

        db
            .prepare(
                'DELETE FROM reviews WHERE id=?'
            )
            .run(
                req.params.id
            );


        res.json({
            ok: true
        });
    }
);


app.patch(
    '/api/admin/reviews/:id/toggle',
    auth,
    (req, res) => {

        db
            .prepare(
                'UPDATE reviews SET active=1-active WHERE id=?'
            )
            .run(
                req.params.id
            );


        res.json({
            ok: true
        });
    }
);


/* =========================================================
   GALERIA - ADMIN
   ========================================================= */

app.get(
    '/api/admin/gallery',
    auth,
    (req, res) => {

        res.json(
            db
                .prepare(
                    'SELECT * FROM gallery ORDER BY id DESC'
                )
                .all()
        );
    }
);


app.post(
    '/api/admin/gallery',
    auth,
    gUpload.single('image'),
    (req, res) => {

        const id =
            Number(
                req.body.id || 0
            );


        const caption =
            clean(
                req.body.caption
            );


        if (!caption) {

            if (
                req.file
            ) {

                removeUpload(
                    'uploads/' +
                    req.file.filename
                );
            }


            return res
                .status(400)
                .json({
                    error:
                        'Informe a legenda.'
                });
        }


        try {

            if (id) {

                const old =
                    db
                        .prepare(
                            'SELECT * FROM gallery WHERE id=?'
                        )
                        .get(id);


                if (!old) {

                    if (
                        req.file
                    ) {

                        removeUpload(
                            'uploads/' +
                            req.file.filename
                        );
                    }


                    return res
                        .status(404)
                        .json({
                            error:
                                'Imagem não encontrada'
                        });
                }


                let image =
                    old.image;


                if (
                    req.file
                ) {

                    image =
                        'uploads/' +
                        req.file.filename;


                    removeUpload(
                        old.image
                    );
                }


                db
                    .prepare(`
                        UPDATE gallery
                        SET
                            caption=?,
                            image=?
                        WHERE id=?
                    `)
                    .run(
                        caption,
                        image,
                        id
                    );

            } else {

                if (
                    !req.file
                ) {

                    return res
                        .status(400)
                        .json({
                            error:
                                'Selecione uma imagem.'
                        });
                }


                db
                    .prepare(`
                        INSERT INTO gallery(
                            caption,
                            image
                        )
                        VALUES(?,?)
                    `)
                    .run(
                        caption,
                        'uploads/' +
                        req.file.filename
                    );
            }


            res.json({
                ok: true
            });

        } catch (error) {

            if (
                req.file
            ) {

                removeUpload(
                    'uploads/' +
                    req.file.filename
                );
            }


            res
                .status(500)
                .json({
                    error:
                        'Não foi possível guardar a imagem.'
                });
        }
    }
);


app.delete(
    '/api/admin/gallery/:id',
    auth,
    (req, res) => {

        const gallery =
            db
                .prepare(
                    'SELECT image FROM gallery WHERE id=?'
                )
                .get(
                    req.params.id
                );


        if (
            gallery
        ) {

            db
                .prepare(
                    'DELETE FROM gallery WHERE id=?'
                )
                .run(
                    req.params.id
                );


            removeUpload(
                gallery.image
            );
        }


        res.json({
            ok: true
        });
    }
);


/* =========================================================
   CONFIGURAÇÕES - ADMIN
   ========================================================= */

app.get(
    '/api/admin/settings',
    auth,
    (req, res) => {

        res.json(
            db
                .prepare(
                    'SELECT * FROM settings WHERE id=1'
                )
                .get()
        );
    }
);


app.put(
    '/api/admin/settings',
    auth,
    (req, res) => {

        const fields = [
            'hero_title',
            'hero_text',
            'about_text',
            'address',
            'phone',
            'hours',
            'maps_url',
            'review_count'
        ];


        const values =
            fields.map(
                (field) =>
                    clean(
                        req.body[field]
                    )
            );


        db
            .prepare(`
                UPDATE settings
                SET
                    ${fields
                        .map(
                            (field) =>
                                field + '=?'
                        )
                        .join(',')}
                WHERE id=1
            `)
            .run(
                ...values
            );


        res.json({
            ok: true
        });
    }
);


/* =========================================================
   ADMIN
   ========================================================= */

app.get(
    '/admin',
    (req, res) => {

        res.sendFile(
            path.join(
                PUBLIC,
                'admin.html'
            )
        );
    }
);


/* =========================================================
   ROTAS NÃO ENCONTRADAS
   ========================================================= */

app.use(
    (req, res) => {

        if (
            req.path.startsWith(
                '/api/'
            )
        ) {

            return res
                .status(404)
                .json({
                    error:
                        'Rota não encontrada'
                });
        }


        if (
            req.path.startsWith(
                '/uploads/'
            )
        ) {

            return res
                .status(404)
                .send(
                    'Imagem não encontrada'
                );
        }


        res.sendFile(
            path.join(
                PUBLIC,
                'index.html'
            )
        );
    }
);


/* =========================================================
   INICIAR SERVIDOR
   ========================================================= */

app.listen(
    PORT,
    () => {

        console.log(
            `BAKONGUINHO API a escutar na porta ${PORT}`
        );
    }
);
