import { Router } from "express";
import fs from 'fs';

const cartRoutes = Router();

const getCarts = async () => {
  try {
    const cartsData = await fs.promises.readFile('src/db/carts.json', 'utf-8');
    return JSON.parse(cartsData);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.promises.writeFile('src/db/carts.json', JSON.stringify([]), 'utf-8');
      return [];
    }
    return [];
  }
}

const saveCarts = async (carts) => {
  try {
    const cartsString = JSON.stringify(carts, null, 2);
    await fs.promises.writeFile('src/db/carts.json', cartsString, 'utf-8');
    return true;
  } catch (error) {
    return false;
  }
}

const generateCartId = async () => {
  const carts = await getCarts();
  const maxId = carts.reduce((max, cart) => Math.max(cart.id, max), 0);
  return maxId + 1;
}

cartRoutes.post('/', async (req, res) => {
  const newCartId = await generateCartId();
  const newCart = {
    id: newCartId,
    products: []
  };

  const carts = await getCarts();
  carts.push(newCart);

  const saved = await saveCarts(carts);
  if (!saved) {
    return res.status(500).send({ status: 'Error', message: 'No se pudo crear el carrito' });
  }

  res.status(201).send({ status: 'Ok', message: 'Carrito creado', cart: newCart });
});

cartRoutes.get('/:cid', async (req, res) => {
  const cartId = +req.params.cid;
  const carts = await getCarts();
  const cart = carts.find(c => c.id === cartId);

  if (!cart) {
    return res.status(404).send({ status: 'Error', message: 'Carrito no encontrado' });
  }

  res.send({ cart });
});

cartRoutes.post('/:cid/product/:pid', async (req, res) => {
  const cartId = +req.params.cid;
  const productId = +req.params.pid;

  const carts = await getCarts();
  const cart = carts.find(c => c.id === cartId);

  if (!cart) {
    return res.status(404).send({ status: 'Error', message: 'Carrito no encontrado' });
  }

  const existingProduct = cart.products.find(p => p.product === productId);

  if (existingProduct) {
    existingProduct.quantity += 1;
  } else {
    cart.products.push({ product: productId, quantity: 1 });
  }

  const saved = await saveCarts(carts);
  if (!saved) {
    return res.status(500).send({ status: 'Error', message: 'No se pudo agregar el producto al carrito' });
  }

  res.send({ status: 'Ok', message: 'Producto agregado al carrito', cart });
});

export default cartRoutes;