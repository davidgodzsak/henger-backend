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
        const collection = getCollection(USER_COLLECION_NAME);
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
                      '$or': [
                        {'purchase': {}},
                        {'purchase': {'$exists': false}},
                        {'purchase.detail.typeName': curr}
                      ]
                    }
                    }, 
                    {
                    '$lookup': {
                        'from': curr, 
                        'localField': 'purchase.detail._id', 
                        'foreignField': '_id', 
                        'as': 'purchase.detail2'
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
      '$match': {
        'active': true
      }
    },
    {
      '$lookup': {
        'from': 'Purchase', 
        'localField': '_id', 
        'foreignField': 'userId', 
        'as': 'purchase'
      }
    },
    {
      '$unwind': {'path':'$purchase', 'preserveNullAndEmptyArrays': true }
    },
    {
      '$match': {
        '$or': [
            { 'purchase': {'$exists': false }},  
            { 'purchase.isBilled': false, 'purchase.markedDeleted': false }
          ]
        }
    },
    {
      '$lookup': {
        'from': 'AnyPurchaseDetail', 
        'localField': 'purchase.detail', 
        'foreignField': '_id', 
        'as': 'purchase.detail'
      }
    }, 
    { '$unwind': { 'path': '$purchase.detail', 'preserveNullAndEmptyArrays': true }}, 
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
    {'$unwind': {'path': '$purchase.detail2', 'preserveNullAndEmptyArrays': true }},
    { '$addFields': { 'purchase.detail': { '$mergeObjects': ["$purchase.detail", "$purchase.detail2"] } } },
    { '$unset': 'detail2' },
    {
      '$group': {
        '_id': {'year': {'$year': '$purchase.date'}, 'month': {'$month': '$purchase.date'}, 'user': {'_id': '$_id', 'name': '$name', 'pin': '$pin', 'monthlyFee': '$monthlyFee'} },
        'purchases': {
          '$push': { '_id': '$purchase._id', 'date': '$purchase.date', 'price': '$purchase.price', 'detail': '$purchase.detail', 'markedDeleted': '$purchase.markedDeleted' }
        }, 
        'total': { '$sum': '$purchase.price' }
      }
    },
    {
     '$project': { 
        "_id": 0, "year": "$_id.year", "month": "$_id.month", "user": "$_id.user", "purchases": 1, "total": 1 }
    },
    { '$sort': { 'user.name': 1 } }
  ]


  // const asd = [
  //   {
  //     $match: {
  //       active: true,
  //       name: "Dávid",
  //     },
  //   },
  //   {
  //     $lookup: {
  //       from: "Purchase",
  //       localField: "_id",
  //       foreignField: "userId",
  //       as: "purchase",
  //     },
  //   },
  //   {
  //     $unwind: {
  //       path: "$purchase",
  //       preserveNullAndEmptyArrays: true,
  //     },
  //   },
  //   {
  //     $match: {
  //       $or: [
  //         {
  //           purchase: {
  //             $exists: false,
  //           },
  //         },
  //         {
  //           "purchase.isBilled": false,
  //           "purchase.markedDeleted": false,
  //         },
  //       ],
  //     },
  //   },
  //   {
  //     $lookup: {
  //       from: "AnyPurchaseDetail",
  //       localField: "purchase.detail",
  //       foreignField: "_id",
  //       as: "purchase.detail",
  //     },
  //   },
  //   {
  //     $unwind: {
  //       path: "$purchase.detail",
  //       preserveNullAndEmptyArrays: true,
  //     },
  //   },
  //   { '$facet': facetItems(purchaseDetails) }, 
  //   {
  //     '$project': {
  //       'allDetails': {
  //         '$setUnion': purchaseDetails.map(purchaseDetailName => `$${purchaseDetailName}`)
  //       }
  //     }
  //   },
    {
      $unwind: "$allDetails",
    },
    {
      $replaceRoot: {
        newRoot: "$allDetails",
      },
    },
    {
      $unwind: {
        path: "$purchase.detail2",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        "purchase.detail": {
          $mergeObjects: [
            "$purchase.detail",
            "$purchase.detail2",
          ],
        },
      },
    },
    {
      $unset: "purchase.detail2",
    },
    {
      $group: {
        _id: {
          year: {
            $year: "$purchase.date",
          },
          user: {
            _id: "$_id",
            name: "$name",
            pin: "$pin",
            monthlyFee: "$monthlyFee",
          },
          month: {
            $month: "$purchase.date",
          },
        },
        purchases: {
          $push: {
            _id: "$purchase._id",
            date: "$purchase.date",
            price: "$purchase.price",
            detail: "$purchase.detail",
            markedDeleted:
              "$purchase.markedDeleted",
          },
        },
        total: {
          $sum: "$purchase.price",
        },
      },
    },
    {
      $project: {
        _id: 0,
        year: "$_id.year",
        month: "$_id.month",
        user: "$_id.user",
        purchases: 1,
        total: 1,
      },
    },
  ]