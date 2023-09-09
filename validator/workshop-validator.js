const Ajv = require("ajv");
const addFormats = require("ajv-formats");

const ajv = new Ajv({ allErrors: true });
addFormats(ajv, ["date", "time", "url"]);

const workshopSchema = {
    type: "object",
    properties: {
        title: { type: "string", minLength: 3 },
        name: { type: "string", minLength: 3 },
        insta: { type: "string", format: "url", minLength: 3 },
        shortDescription: { type: "string", minLength: 10, maxLength: 160 },
        cover: { type: "string", format: "url", minLength: 3 },
        price: { type: "string" },
        level: { type: "string" },
        description: { type: "string", minLength: 3 },
        date: { type: "string", format: "date" },
        startTime: { type: "string" },
        endTime: { type: "string" },
        rsvp: { type: "string", format: "url", minLength: 3 },
        gallery: { type: "array", items: { type: "string", format: "url", minLength: 3 } },
    },
    required: ["title", "name", "shortDescription", "price", "date", "startTime", "endTime", "rsvp"]
}

const validate = ajv.compile(workshopSchema)

module.exports = validate;