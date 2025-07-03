import { ObjectId } from 'mongodb'

import { logger } from '../../services/logger.service.js'
import { makeId } from '../../services/util.service.js'
import { dbService } from '../../services/db.service.js'
import { asyncLocalStorage } from '../../services/als.service.js'

const PAGE_SIZE = 3

export const gigService = {
    remove,
    query,
    getById,
    add,
    update,
    addGigMsg,
    removeGigMsg,
}

export const orderService = {
    query,
    add
}

async function query(filterBy = {}) {
    try {
        const criteria = _buildCriteria(filterBy)
        const sort = _buildSort(filterBy)

        const collection = await dbService.getCollection('gig')
        var gigCursor = await collection.find(criteria, { sort })

        if (filterBy.pageIdx !== undefined) {
            gigCursor.skip(filterBy.pageIdx * PAGE_SIZE).limit(PAGE_SIZE)
        }

        const gigs = gigCursor.toArray()
    
        return gigs
    } catch (err) {
        logger.error('cannot find gigs', err)
        throw err
    }
}

async function getById(gigId) {
    try {
        console.log('gigId',gigId)
        const criteria = { _id: ObjectId.createFromHexString(gigId) }
        const collection = await dbService.getCollection('gig')
        const gig = await collection.findOne(criteria)

        gig.createdAt = gig._id.getTimestamp()
        return gig
    } catch (err) {
        logger.error(`while finding gig ${gigId}`, err)
        throw err
    }
}

// async function remove(gigId) {
//     const { loggedinUser } = asyncLocalStorage.getStore()
//     const { _id: ownerId, isAdmin } = loggedinUser

//     try {
//         const criteria = {
//             _id: ObjectId.createFromHexString(gigId),
//         }

//         if (!isAdmin) criteria['owner._id'] = ownerId

//         const collection = await dbService.getCollection('gig')
//         const res = await collection.deleteOne(criteria)

//         if (res.deletedCount === 0) throw ('Not your gig')
//         return gigId
//     } catch (err) {
//         logger.error(`cannot remove gig ${gigId}`, err)
//         throw err
//     }
// }
async function remove(gigId) {
    try {
        const criteria = {
            _id: ObjectId.createFromHexString(gigId),
        }

        const collection = await dbService.getCollection('gig')
        const res = await collection.deleteOne(criteria)

        if (res.deletedCount === 0) throw new Error('Gig not found')
        return gigId
    } catch (err) {
        logger.error(`cannot remove gig ${gigId}`, err)
        throw err
    }
}


async function add(gig) {
    try {
        const collection = await dbService.getCollection('gig')
        await collection.insertOne(gig)

        return gig
    } catch (err) {
        logger.error('cannot insert gig', err)
        throw err
    }
}

async function update(gig) {
    const gigToSave = { 
        title: gig.title, 
        description: gig.description,
        category: gig.category,
        price: gig.price,
        daysToMake: gig.daysToMake,
        imgUrls: gig.imgUrls
    }

    try {
        const criteria = { _id: ObjectId.createFromHexString(gig._id) }
        const collection = await dbService.getCollection('gig')
        await collection.updateOne(criteria, { $set: gigToSave })

        return gig
    } catch (err) {
        logger.error(`cannot update gig ${gig._id}`, err)
        throw err
    }
}

async function addGigMsg(gigId, msg) {
    try {
        const criteria = { _id: ObjectId.createFromHexString(gigId) }
        msg.id = makeId()

        const collection = await dbService.getCollection('gig')
        await collection.updateOne(criteria, { $push: { msgs: msg } })

        return msg
    } catch (err) {
        logger.error(`cannot add gig msg ${gigId}`, err)
        throw err
    }
}

async function removeGigMsg(gigId, msgId) {
    try {
        const criteria = { _id: ObjectId.createFromHexString(gigId) }

        const collection = await dbService.getCollection('gig')
        await collection.updateOne(criteria, { $pull: { msgs: { id: msgId } } })

        return msgId
    } catch (err) {
        logger.error(`cannot remove gig msg ${gigId}`, err)
        throw err
    }
}

function _buildCriteria(filterBy) {
    const criteria = {}

    // Text search in title and description
    if (filterBy.txt) {
        criteria.$or = [
            { title: { $regex: filterBy.txt, $options: 'i' } },
            { description: { $regex: filterBy.txt, $options: 'i' } }
        ]
    }

    // Category filter
    if (filterBy.category) {
        criteria.category = filterBy.category
    }

    // Level filter (owner level)
    if (filterBy.level) {
        criteria['owner.level'] = filterBy.level
    }

    // Price filter
    if (filterBy.price) {
        if (filterBy.price === 'Under 50₪') {
            criteria.price = { $lt: 50 }
        } else if (filterBy.price === '50₪–105₪') {
            criteria.price = { $gte: 50, $lte: 105 }
        } else if (filterBy.price === '105₪ and above') {
            criteria.price = { $gt: 105 }
        }
    }

    // Delivery time filter
    if (filterBy.deliveryTime) {
        let deliveryTime
        switch (filterBy.deliveryTime) {
            case 'Express 24H':
                deliveryTime = 1
                break
            case 'Up to 3 days':
                deliveryTime = 3
                break
            case 'Up to 7 days':
                deliveryTime = 7
                break
        }
        if (deliveryTime) {
            criteria.daysToMake = { $lte: deliveryTime }
        }
    }

    return criteria
}

function _buildSort(filterBy) {
    if (!filterBy.sortField) return {}
    return { [filterBy.sortField]: filterBy.sortDir }
}

async function queryOrders() {
    try {
        const collection = await dbService.getCollection('order')
        const orders = await collection.find({}).toArray()
        return orders
    } catch (err) {
        logger.error('Cannot find orders', err)
        throw err
    }
}

async function addOrder(order) {
    try {
        const collection = await dbService.getCollection('order')
        await collection.insertOne(order)
        return order
    } catch (err) {
        logger.error('Cannot insert order', err)
        throw err
    }
}