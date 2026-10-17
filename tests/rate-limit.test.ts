import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CHAT_PER_DAY,
  CHAT_PER_HOUR,
  SEARCH_PER_HOUR,
  SITE_KEY,
  checkChatDailyCap,
  checkRateLimit,
  checkSearchRateLimit,
} from "../src/app/api/chat/lib/rate-limit";

test("the chat budget is per address, and closes after the hour's allowance", () => {
  for (let i = 0; i < CHAT_PER_HOUR; i += 1) {
    assert.equal(checkRateLimit("chat-a").allowed, true, `request ${i + 1} must pass`);
  }

  const blocked = checkRateLimit("chat-a");
  assert.equal(blocked.allowed, false);
  assert.ok((blocked.retryAfter ?? 0) > 0, "a refused request says when to come back");

  assert.equal(checkRateLimit("chat-b").allowed, true, "another address keeps its own budget");
});

test("search has its own, larger hourly budget", () => {
  for (let i = 0; i < SEARCH_PER_HOUR; i += 1) {
    assert.equal(checkSearchRateLimit("search-a").allowed, true, `request ${i + 1} must pass`);
  }
  assert.equal(checkSearchRateLimit("search-a").allowed, false);

  assert.equal(
    checkRateLimit("search-b").allowed,
    true,
    "a search-heavy crawler must not spend the chat's allowance",
  );
});

test("the daily cap is site-wide rather than per address", () => {
  for (let i = 0; i < CHAT_PER_DAY; i += 1) {
    assert.equal(checkChatDailyCap(SITE_KEY).allowed, true, `request ${i + 1} must pass`);
  }
  assert.equal(checkChatDailyCap(SITE_KEY).allowed, false);

  assert.equal(
    checkRateLimit("daily-fresh-address").allowed,
    true,
    "the hourly limiter is a separate counter from the daily cap",
  );
});
