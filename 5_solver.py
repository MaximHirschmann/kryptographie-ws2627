"""Decrypt the complete Beaufort ciphertext from Question 5 (A = 0)."""

CIPHERTEXT = """MKKBPNRBPVNNKGBMKKMFUOKFBVTOFQZD
DPPSZKOHNYHOBFELUEURGFGRKORLMRVK
FSFKOANYHOPHNUFIBZWKGMKKLFOJPEGO
JCAFTNHSIAVOUZQYHOIXFKAAREKWTUGV
LTMZZEARMNHTDHGAGRYOAAFJBECNKOPF
JQUZTDRTOCSKAHPJKKBPNDCOFSNUAPCY
AQIXFNSGCPXSXUYABPNYJBFTKGASBZKZ
AXEINPFAWKBBNVLPDRDHZNDBLLNZAYIM
KKPLNRZDPFAGFNURWZFAKGGTSOANMXZX
SRBZVSCKRVKFSZDKHRKQOTOZOMFMNBZM
RXWSGCTKSCN"""
KEY = "FROST"


def beaufort(text, key):
    """Encrypt or decrypt ASCII letters; ignore whitespace in the text."""
    letters = "".join(text.split())
    if not key or not key.isascii() or not key.isalpha():
        raise ValueError("The key must contain one or more ASCII letters.")
    if letters and (not letters.isascii() or not letters.isalpha()):
        raise ValueError("The text must contain only ASCII letters and whitespace.")
    letters, key = letters.upper(), key.upper()
    return "".join(
        chr((ord(key[i % len(key)]) - ord(ch)) % 26 + ord("A"))
        for i, ch in enumerate(letters)
    )


if __name__ == "__main__":
    print(beaufort(CIPHERTEXT, KEY).lower())
