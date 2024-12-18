import asyncio
import requests
import subprocess
from datetime import datetime
from telegram import Update, ReplyKeyboardMarkup, ReplyKeyboardRemove
from telegram.ext import ContextTypes, ConversationHandler, CommandHandler, MessageHandler, filters

# Define conversation states
SELECT_CHAIN, ENTER_AMOUNT, ENTER_WALLET = range(3)


# TON Node API details
API_URL = "https://toncenter.com/api/v2"

# Admin user IDs (replace with actual Telegram user IDs)
AUTHORIZED_ADMINS = [6465646323, 987654321]

# Check if the user is an admin
def is_admin(user_id):
    return user_id in AUTHORIZED_ADMINS

# Wrapper to ensure only admins can access certain commands
def admin_only(handler):
    async def wrapper(update: Update, context: ContextTypes.DEFAULT_TYPE):
        user_id = update.message.from_user.id
        if not is_admin(user_id):
            await update.message.reply_text("❌ Access denied. Admins only.")
            return
        await handler(update, context)
    return wrapper

# /start command
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("Welcome to the Crypto Token Sales Bot!")

# /help command
async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    help_text = (
        "Welcome to the Crypto Token Sales Bot!\n\n"
        "Commands:\n"
        "/start - Start interacting with the bot\n"
        "/help - Get help and instructions\n"
        "/buy - Purchase crypto tokens\n"
    )
    await update.message.reply_text(help_text)

# /buy command entry point
async def buy_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    blockchain_options = [["TON", "ETH"], ["BSC", "TRON"], ["SUI"]]
    reply_markup = ReplyKeyboardMarkup(blockchain_options, one_time_keyboard=True)
    await update.message.reply_text(
        "Please select a blockchain network:", reply_markup=reply_markup
    )
    return SELECT_CHAIN

# Handle blockchain selection
async def select_blockchain(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data['blockchain'] = update.message.text
    await update.message.reply_text(
        f"You selected {update.message.text}. Now, please enter the amount of tokens you'd like to buy:",
        reply_markup=ReplyKeyboardRemove()
    )
    return ENTER_AMOUNT

# Handle token amount with validation
async def enter_amount(update: Update, context: ContextTypes.DEFAULT_TYPE):
    try:
        amount = float(update.message.text)
        if amount <= 0:
            raise ValueError
        context.user_data['amount'] = amount
        await update.message.reply_text("Great! Please enter your wallet address (Make sure the address is for the selected blockchain):")
        return ENTER_WALLET
    except ValueError:
        await update.message.reply_text("Please enter a valid positive number for the amount.")
        return ENTER_AMOUNT

# Handle wallet address and transaction processing
async def enter_wallet(update: Update, context: ContextTypes.DEFAULT_TYPE):
    wallet = update.message.text.strip()
    if len(wallet) < 48:
        await update.message.reply_text("Invalid TON wallet address. Please try again:")
        return ENTER_WALLET

    blockchain = context.user_data['blockchain']
    amount = context.user_data['amount']

    # Calculate fees
    fees = context.bot_data.get("fees", {})
    fee_percentage = fees.get(blockchain, 0)  # Default to 0%
    fee_amount = amount * (fee_percentage / 100)

    # Transaction summary
    await update.message.reply_text(
        f"Transaction Summary:\n"
        f"Blockchain: {blockchain}\n"
        f"Amount: {amount}\n"
        f"Platform Fee ({fee_percentage}%): {fee_amount:.2f}\n"
        f"Total: {amount + fee_amount:.2f}\n"
        f"Wallet Address: {wallet}\n\n"
        "Processing your transaction..."
    )
    await asyncio.sleep(3)

    # Testnet ******************************************************************

    # Prepare the transaction
    #sender_wallet = "EQBbwxC0WnOlXVwC5a8SEwd-_jtg3d3YCt0th_VA4IC9NkDS"     #"YOUR_TON_WALLET"  # Replace with your wallet address
    sender_private_key = "38b162ae7af095971c65824e767e1d312402f02030d2e47df9551d055d21ca6006652d69d5b97c24627d58bcb69bc217beabbc7b04c58b7cdcbbbaaa296b9d94"   #"YOUR_PRIVATE_KEY"  # Replace with your private key
    
    # Call the TON.js script
    try:
        result = subprocess.run(
            ["node", "ton_transfer.js", sender_private_key, wallet, str(amount)],
            capture_output=True,
            text=True,
        )
        if result.returncode == 0:
            await update.message.reply_text("🎉 Transaction successful!")
        else:
            await update.message.reply_text(f"❌ Transaction failed: {result.stderr}")
    except Exception as e:
        await update.message.reply_text(f"❌ Error: {str(e)}")

    # /Testnet *****************************************************************

    # Admins notification
    if context.bot_data.get("notifications_enabled", True):
        for admin_id in AUTHORIZED_ADMINS:
            try:
                await context.bot.send_message(
                    chat_id=admin_id,
                    text=(
                        f"🔔 New Transaction:\n"
                        f"User: {update.message.from_user.username or 'Unknown'}\n"
                        f"Blockchain: {blockchain}\nAmount: {amount}\n"
                        f"Fee: {fee_amount:.2f}\n"
                        #f"Transaction Hash: {transaction_hash}\n"
                    )
                )
            except Exception as e:
                print(f"Failed to notify admin {admin_id}: {e}")



    return ConversationHandler.END

# /admin command
@admin_only
async def admin_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    admin_menu = (
        "🔧 Admin Commands:\n"
        "/setfee - Set transaction fees\n"
        "/viewlogs - View transaction logs\n"
        "/clearlogs - Clear transaction logs\n"
        "/exportlogs - Export the logs to a readable document\n"
    )
    await update.message.reply_text(admin_menu)


# /setfee command
@admin_only
async def set_fee_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    current_fees = context.bot_data.get("fees", {})
    fees_message = "\n".join([f"{chain}: {fee}%" for chain, fee in current_fees.items()]) or "No fees set."
    await update.message.reply_text(
        f"🔧 Current Fees:\n{fees_message}\n\n"
        "Please specify the blockchain and fee percentage in the format:\n`<blockchain> <fee>`\nExample: `ETH 2`",
        parse_mode="Markdown"
    )
    # Indicate that the admin is setting a fee
    context.user_data["setting_fee"] = True

# Process fee-setting input
@admin_only
async def process_set_fee(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not context.user_data.get("setting_fee", False):
        # Ignore unrelated messages
        return

    try:
        # Parse the input
        message = update.message.text.split()
        blockchain, fee = message[0].upper(), float(message[1])

        if not (0 < fee <= 100):
            raise ValueError("Fee percentage must be between 0 and 100.")

        # Save the fee
        current_fees = context.bot_data.setdefault("fees", {})
        current_fees[blockchain] = fee

        await update.message.reply_text(f"✅ Fee for {blockchain} set to {fee}%.")
        context.user_data["setting_fee"] = False  # Reset the fee-setting flag
    except (IndexError, ValueError):
        await update.message.reply_text("❌ Invalid format. Use: `<blockchain> <fee>`")



# /viewlogs command
@admin_only
async def view_logs_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    logs = context.bot_data.get("logs", [])
    logs_message = "\n".join(logs) or "No recent transactions."
    await update.message.reply_text(f"📝 Transaction Logs:\n{logs_message}")

# /clearlogs command
@admin_only
async def clear_logs_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.bot_data["logs"] = []
    await update.message.reply_text("✅ All transaction logs cleared.")


# /exportlogs command to allow admins to export logs as a text file
@admin_only
async def export_logs_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    logs = context.bot_data.get("logs", [])
    if not logs:
        await update.message.reply_text("❌ No logs available to export.")
        return

    # Prepare log file
    log_text = "\n\n".join(logs)
    log_file = "transaction_logs.txt"
    with open(log_file, "w") as file:
        file.write(log_text)

    # Send the log file to the admin
    await update.message.reply_document(
        document=open(log_file, "rb"),
        filename=log_file,
        caption="📄 Transaction Logs"
    )

# Admin notifications
@admin_only
async def toggle_notifications_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    notifications_enabled = context.bot_data.get("notifications_enabled", True)
    context.bot_data["notifications_enabled"] = not notifications_enabled

    status = "enabled" if not notifications_enabled else "disabled"
    await update.message.reply_text(f"🔔 Admin notifications are now {status}.")


