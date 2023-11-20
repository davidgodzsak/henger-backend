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
        description: { type: "string", minLength: 160 },
        cover: { type: "string" },
        price: { type: "string" },
        level: { type: "string" },
        date: { type: "string", format: "date" },
        startTime: { type: "number", minimum:0, maximum: 23 },
        endTime: { type: "number", minimum:0, maximum: 23 },
        rsvp: { type: "string", minLength: 3 },
        gallery: { type: "array", items: { type: "string" } },
    },
    required: ["title", "name", "shortDescription", "price", "date", "startTime", "endTime", "rsvp", "cover"]
}

const validate = ajv.compile(workshopSchema)

module.exports = validate;