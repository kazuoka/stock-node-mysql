const express = require('express');
const router = express.Router();

const mysql2 = require('mysql2');
const mysql = mysql2.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'nodestock_db'
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'GeneralKazuoka' });
});
router.get('/home', function(req, res, next) {
  res.render('index', { title: 'GeneralKazuoka' });
});
router.get('/product', (req, res) => {
  mysql.query('SELECT * FROM product_tb', (err, rs) => {
    if (err) {
      res.send(err);
    } else {
      res.render('product', { data: {}, products: rs });
    }
  })
});
router.post('/product', (req, res) => {
  mysql.query('INSERT INTO product_tb SET ?', req.body, (err, rs) => {
    if (err) {
      res.send(err);
    } else {
      res.redirect('product');
    }
  })
});
router.get('/productDelete/:id', (req, res) => {
  let condition = [req.params.id];
  mysql.query('DELETE FROM product_tb WHERE id = ?', condition, (err, rs) => {
    if (err) {
      res.send(err);
    } else {
      res.redirect('/product');
    }
  })
});
router.get('/productEdit/:id', (req, res) => {
  let condition = [req.params.id];
  let sql = 'SELECT * FROM product_tb WHERE id = ?';

  mysql.query(sql, condition, (err, rs) => {
    if (err) {
      res.send(err);
    } else {
      sql = 'SELECT * FROM product_tb';

      mysql.query(sql, (err, products) => {
        if (err) {
          res.send(err);
        } else {
          res.render('product', { data: rs[0], products: products });
        }
     })
    }
  })
});
router.post('/productEdit/:id', (req, res) => {
  let params = [req.body.barcode, req.body.name, req.params.id];
  let sql = 'UPDATE product_tb SET barcode = ?, name = ? WHERE id = ?';

  mysql.query(sql, params, (err, rs) => {
    if (err) {
      res.send(err);
    } else {
      res.redirect('/product');
    }
  })
});
router.get('/importStock', (req, res) => {
  res.render('importStock');
})
router.post('/importStock', (req, res) => {
  let sql = 'INSERT INTO importstock_tb(product_id, qty, import_date) VALUES(?, ?, NOW())';
  let params = [req.body.product_id, req.body.qty];
  mysql.query(sql, params, (err, rs) => {
    if (err) {
      res.send(err);
    } else {
      res.redirect('/importStockSuccess');
    }
  })
})
router.get('/importStockSuccess', (req, res) => {
  res.render('importStockSuccess');
})
router.post('/searchProduct', (req, res) => {
  let sql = 'SELECT * FROM product_tb WHERE barcode = ?';
  mysql.query(sql, req.body.barcode, (err, rs) => {
    if (err) {
      res.send(err);
    } else {
      res.json(rs);
    }
  })
})
router.get('/outStock', (req, res) => {
  res.render('outStock');
})
router.post('/outStock', (req, res) => {
  let sql = 'INSERT INTO outstock_tb(product_id, qty, outdate) VALUES(?, ?, NOW())';
  let params = [req.body.product_id, req.body.qty];

  mysql.query(sql, params, (err, rs) => {
    if (err) {
      res.send(err);
    } else {
      res.redirect('/outStockSuccess');
    }
  })
})
router.get('/outStockSuccess', (req, res) => {
  res.render('outStockSuccess');
})
router.get('/report', (req, res) => {
  let data = { from: '', to: '', products: [] };
  res.render('reportStock', data);
})
router.post('/report', (req, res) => {
  let from = req.body.from + ' 00:00';
  from = from.replace('/', '-');

  let to = req.body.to + ' 23:59';
  to = to.replace('/', '-');

  let sql = `
    SELECT
      product_tb.barcode,
      product_tb.name,
      (
        SELECT SUM(qty) FROM importstock_tb
        WHERE (import_date BETWEEN ? AND ?)
        AND product_id = product_tb.id
      ) AS total_import,
      (
        SELECT SUM(qty) FROM outstock_tb
        WHERE (outdate BETWEEN ? AND ?)
        AND product_id = product_tb.id
      ) AS total_out
    FROM product_tb
  `;
  let params = [from, to, from, to];

  mysql.query(sql, params, (err, rs) => {
    if (err) {
      res.send(err);
    } else {
      let data = { from: req.body.from, to: req.body.to, products: rs };
      res.render('reportStock', data);
    }
  })
})

module.exports = router;
