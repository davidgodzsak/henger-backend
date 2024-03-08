// 'use strict';

import { Router } from 'express';
import { getCollection } from '../utils/db.mjs';
import { ObjectId } from 'mongodb';

const HENGER_URL = 'https://henger.studio/'
const INVOICE_COLLECION_NAME = "Invoice";
const PURCHASE_COLLECION_NAME = "Purchase";
const USER_COLLECION_NAME = "User";

const purchaseDetails = [
    'FiringPurchaseDetail',
    'ClayPurchaseDetail',
    'PrivateClassDetail',
    'WholeKilnDetail',
    'WorkshopPurchaseDetail'
]

const router = Router();

router.get('/prepare', async (_, res) => {
    try {
        const collection = getCollection(PURCHASE_COLLECION_NAME);
        // this is heavy stuff
        const purchases = await collection.aggregate(aggregation).toArray();
        res.status(200).json(purchases);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
})

export default router;

// utils

function facetItems(purchaseDetailNames) {
    return purchaseDetailNames.reduce( 
        (acc, curr) => (
            {
                ...acc, 
                [curr]: [
                    {
                    '$match': {
                        'detail.typeName': curr
                    }
                    }, 
                    {
                    '$lookup': {
                        'from': curr, 
                        'localField': 'detail._id', 
                        'foreignField': '_id', 
                        'as': 'detail2'
                    }
                    }
                ]
            }
        ),
        {}
    )
}

const aggregation = [
    {
      '$match': { 'isBilled': false, 'markedDeleted': false }
    },
    {
      '$lookup': {
        'from': 'AnyPurchaseDetail', 
        'localField': 'detail', 
        'foreignField': '_id', 
        'as': 'detail'
      }
    }, 
    { '$unwind': '$detail' }, 
    { '$facet': facetItems(purchaseDetails) }, 
    {
      '$project': {
        'allDetails': {
          '$setUnion': purchaseDetails.map(purchaseDetailName => `$${purchaseDetailName}`)
        }
      }
    },
    { '$unwind': '$allDetails' },
    {
      '$replaceRoot': { 'newRoot': '$allDetails' }
    }, 
    {'$unwind': '$detail2'},
    { '$addFields': { 'detail': { '$mergeObjects': ["$detail", "$detail2"] } } },
    { '$unset': 'detail2' },
    {
      '$group': {
        '_id': '$userId', 
        'purchases': {
          '$push': { '_id': '$_id', 'date': '$date', 'price': '$price', 'detail': '$detail', 'markedDeleted': '$markedDeleted' }
        }, 
        'total': { '$sum': '$price' }
      }
    }, 
    {
      '$lookup': {
        'from': USER_COLLECION_NAME, 
        'localField': '_id', 
        'foreignField': '_id', 
        'as': 'user'
      }
    }, 
    { '$unwind': '$user' },
    { '$sort': { 'user.name': 1 } }
  ]