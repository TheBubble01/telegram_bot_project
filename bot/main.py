import os
#***********************
from telegram import Update, BotCommand
#***********************
from dotenv import load_dotenv
from telegram.ext import ApplicationBuilder, ContextTypes, CommandHandler, ConversationHandler, MessageHandler, filters
from handlers import (
    start, help_command, buy_command, select_blockchain, enter_amount, enter_wallet, cancel,
    admin_command, set_fee_command, process_set_fee, view_logs_command, clear_logs_command, export_logs_command, toggle_notifications_command,
    SELECT_CHAIN, ENTER_AMOUNT, ENTER_WALLET
)

# Load environment variable
load_dotenv()
BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")

if __name__ == "__main__":
    app = ApplicationBuilder().token(BOT_TOKEN).build()

    # Regular user commands
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help_command))

    # Conversation handler for /buy
    buy_handler = ConversationHandler(
        entry_points=[CommandHandler("buy", buy_command)],
        states={
            SELECT_CHAIN: [MessageHandler(filters.TEXT & ~filters.COMMAND, select_blockchain)],
            ENTER_AMOUNT: [MessageHandler(filters.TEXT & ~filters.COMMAND, enter_amount)],
            ENTER_WALLET: [MessageHandler(filters.TEXT & ~filters.COMMAND, enter_wallet)],
        },
        fallbacks=[CommandHandler("cancel", cancel)],
    )
    app.add_handler(buy_handler)
    app.add_handler(CommandHandler("cancel", cancel))

    # Admin commands
    app.add_handler(CommandHandler("admin", admin_command))
    app.add_handler(CommandHandler("setfee", set_fee_command))
    app.add_handler(CommandHandler("viewlogs", view_logs_command))
    app.add_handler(CommandHandler("clearlogs", clear_logs_command))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, process_set_fee))
    app.add_handler(CommandHandler("exportlogs", export_logs_command))
    app.add_handler(CommandHandler("togglenotifications", toggle_notifications_command))

    print("Bot is running...")
    app.run_polling()

