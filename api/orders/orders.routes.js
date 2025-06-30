import express from 'express'
import { getOrders, addOrder } from './orders.controller.js'

const router = express.Router()

router.get('/', getOrders)
router.post('/', addOrder)

export const ordersRoutes = router 