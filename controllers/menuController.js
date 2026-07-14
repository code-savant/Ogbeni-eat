const Menu = require('../models/Menu');

const getMenus = async (req, res, next) => {
  try {
    const menus = await Menu.findAll();
    res.json(menus);
  } catch (error) {
    next(error);
  }
};

const getMenuById = async (req, res, next) => {
  try {
    const menu = await Menu.findByPk(req.params.id);
    if (!menu) return res.status(404).json({ message: 'Menu item not found' });
    res.json(menu);
  } catch (error) {
    next(error);
  }
};

const createMenu = async (req, res, next) => {
  try {
    const menu = await Menu.create(req.body);
    res.status(201).json(menu);
  } catch (error) {
    next(error);
  }
};

const updateMenu = async (req, res, next) => {
  try {
    const menu = await Menu.findByPk(req.params.id);
    if (!menu) return res.status(404).json({ message: 'Menu item not found' });
    await menu.update(req.body);
    res.json(menu);
  } catch (error) {
    next(error);
  }
};

const deleteMenu = async (req, res, next) => {
  try {
    const menu = await Menu.findByPk(req.params.id);
    if (!menu) return res.status(404).json({ message: 'Menu item not found' });
    await menu.destroy();
    res.json({ message: 'Menu item removed' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMenus,
  getMenuById,
  createMenu,
  updateMenu,
  deleteMenu,
};
