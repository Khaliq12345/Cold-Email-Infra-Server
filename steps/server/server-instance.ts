import axios from "axios";

export const instance = axios.create({
  baseURL: "https://api.hetzner.cloud",
  headers: {
    Authorization:
      "Bearer HT0NU0CSaplwppzvcJqzBl35lgX1qZnzuNddmX6mFrg9CbuzGYtrpdhmVoF2CGaB",
    "Content-Type": "application/json",
  },
});
