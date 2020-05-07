const assert = require("assert");

const {
  //load,
  //edit,
  generateKey,
} = require("../src");

describe("env-credentials", () => {
  describe("generateKey", () => {
    it("should generate new encryption key", () => {
      const key = generateKey();
      assert(typeof key === "string");
    });
  });

  describe("load", () => {
    it("should load credentials with default options");
    it("should load credentials for given envionment");
    it("should load credentials from provided using file option");
    it("should load credentials from provided using masterkey option");
  });
});