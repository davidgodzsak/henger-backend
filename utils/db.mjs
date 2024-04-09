import { MongoClient, ServerApiVersion } from 'mongodb';

const uri = process.env.DB_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

export const session = client.startSession();

let conn;

try {
  console.log('Connecting to db...')
  conn = await client.connect();
} catch (e) {
  console.error('Could not connect to DB!', e);
  throw e;
}

let db = conn.db("henger_costs");

export function getCollection(collectionName) {
  if (!db) {
      throw new Error("No database connection");
  }
  return db.collection(collectionName);
}
