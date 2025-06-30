import { dbService } from '../../services/db.service.js'
import { logger } from '../../services/logger.service.js'

export const orderService = {
    query,
    add
}

async function query() {
    try {
        const collection = await dbService.getCollection('order')
        const orders = await collection.find({}).toArray()
        return orders
    } catch (err) {
        logger.error('Cannot find orders', err)
        throw err
    }
}

async function add(order) {
    try {
        const collection = await dbService.getCollection('order')
        await collection.insertOne(order)
        return order
    } catch (err) {
        logger.error('Cannot insert order', err)
        throw err
    }
} 