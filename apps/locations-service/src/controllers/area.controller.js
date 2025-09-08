const Area = require('../models/Area.model');

exports.createArea = async (req, res) => {
    try {
        const { area_name } = req.body;
        if (!area_name) {
            return res.status(400).json({ message: 'area_name is required' });
        }
        const area = await Area.create({ area_name });
        return res.status(201).json(area);
    } catch (error) {
        console.error('createArea error', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.getAreas = async (_req, res) => {
    try {
        const areas = await Area.findAll({ order: [['area_id', 'ASC']] });
        return res.status(200).json(areas);
    } catch (error) {
        console.error('getAreas error', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.getAreaById = async (req, res) => {
    try {
        const { id } = req.params;
        const area = await Area.findByPk(id);
        if (!area) {
            return res.status(404).json({ message: 'Area not found' });
        }
        return res.status(200).json(area);
    } catch (error) {
        console.error('getAreaById error', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.updateArea = async (req, res) => {
    try {
        const { id } = req.params;
        const { area_name } = req.body;
        if (!area_name) {
            return res.status(400).json({ message: 'area_name is required' });
        }
        const area = await Area.findByPk(id);
        if (!area) {
            return res.status(404).json({ message: 'Area not found' });
        }
        area.area_name = area_name;
        await area.save();
        return res.status(200).json(area);
    } catch (error) {
        console.error('updateArea error', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.deleteArea = async (req, res) => {
    try {
        const { id } = req.params;
        const area = await Area.findByPk(id);
        if (!area) {
            return res.status(404).json({ message: 'Area not found' });
        }
        await area.destroy();
        return res.status(204).send();
    } catch (error) {
        console.error('deleteArea error', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};


