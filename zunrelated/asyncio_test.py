import asyncio

async def fetch_data():
    print("Start fetching...")
    await asyncio.sleep(2)  # Simulates a network delay
    print("Done fetching!")
    return {"data": 1}

async def main():
    # Run fetch_data concurrently with other logic
    result = await fetch_data()
    print(f"Result: {result}")

# Run the event loop
asyncio.run(main())
