---
title: Get a DeepSeek API key
description: Sign up for the DeepSeek API platform, add credit, create a key, and store it safely in Deepsand.
---

# Get a DeepSeek API key

Deepsand needs a model provider to power the assistant. The default configuration uses DeepSeek. This page walks through creating an account, adding credit, making an API key, and saving it in Deepsand.

If you already have an API key from another provider, skip to [Use a key you already have](#use-a-key-you-already-have).

## Before you begin

You will need:

- An email address or a supported sign-in account.
- A payment method for API credit.
- A few minutes to create the key and paste it into Deepsand.

The DeepSeek API is billed separately from the DeepSeek chat website and mobile app. Adding credit on the API platform is what allows the assistant to make requests.

## 1. Create a DeepSeek account

1. Open the [DeepSeek API platform](https://platform.deepseek.com/).
2. Select **Sign up** or **Log in**.
3. Create an account with your email address, or use one of the supported sign-in options.
4. Verify your email address or phone number if the platform asks you to.

## 2. Add credit

1. Sign in to the API platform.
2. Open the billing or top-up section in the dashboard.
3. Add the amount of credit you want to use.
4. Complete the payment.

API usage is deducted from this balance. The platform shows the current balance, usage and pricing. Start with a small amount while you are trying Deepsand; you can add more later.

## 3. Create an API key

1. Open the **API keys** section of the platform.
2. Select **Create new API key** or the equivalent button.
3. Give the key a name you will recognize, such as **Deepsand**.
4. Create the key and copy it immediately.

The key is usually shown only once. Treat it like a password: anyone who has it can spend the credit on your account.

## 4. Save the key in Deepsand

1. Open Deepsand.
2. Open **Settings**.
3. Find the **API key** field under default credentials.
4. Paste the key.
5. Select **Save key**.

Deepsand stores the key in your operating system's keystore, not in its settings file. The window only shows the last four characters after saving, so you can confirm a key is present without exposing it again.

The app-wide key is used when neither the host DeepCode configuration nor a project supplies its own key. A project-level key still takes precedence.

## Use a key you already have

If you already have an API key, you do not need to create a DeepSeek account.

- To use it for every project, open **Settings**, enter the key in the **API key** field, and save it.
- To use a different endpoint or model, also set the base URL and model in **Settings** or in the project's own credentials.
- To keep a key only for one project, open that project's settings and enter it there instead.

The provider must expose an API that the DeepCode CLI can call. If you are using a non-DeepSeek provider, enter its base URL and model name rather than the DeepSeek defaults.

## If something does not work

- **The key is rejected:** create a new key on the platform and replace the stored one.
- **The balance is empty:** add credit to the API account. A chat subscription does not automatically fund API usage.
- **The assistant cannot reach the provider:** check the project's network mode and allowlist. The model endpoint must be reachable.
- **You want to remove the key:** open **Settings** and select **Remove key**.

## Related pages

- [Getting started](./getting-started)
- [What is Deepsand?](./what-is-deepsand)
- [How the sandbox works](./security)
