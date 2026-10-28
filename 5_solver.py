c = """MKKBPNRBPV...RXWSGCTKSCN""".replace("\n", "")
key = "FROST"

print("".join(chr((ord(key[i % 5]) - ord(ch)) % 26 + 65) for i, ch in enumerate(c)))
