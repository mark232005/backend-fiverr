import { orderService } from './orders.service.js'
import { logger } from '../../services/logger.service.js'

export async function getOrders(req, res) {
    try {
        const orders = await orderService.query()
        res.json(orders)
    } catch (err) {
        logger.error('Failed to get orders', err)
        res.status(400).send({ err: 'Failed to get orders' })
    }
}

export async function addOrder(req, res) {
    try {
        const order = req.body
        const savedOrder = await orderService.add(order)
        res.json(savedOrder)
    } catch (err) {
        logger.error('Failed to add order', err)
        res.status(400).send({ err: 'Failed to add order' })
    }
}
