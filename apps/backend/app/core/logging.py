import logging

SENSITIVE_KEYS = {"api_key", "authorization", "token", "password", "secret", "NOMAD_ENCRYPTION_KEY"}


class RedactingFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        message = record.getMessage()
        for key in SENSITIVE_KEYS:
            if key in message.lower():
                record.msg = "[REDACTED_SENSITIVE_LOG]"
                record.args = ()
                break
        return True


def configure_logging() -> None:
    logger = logging.getLogger()
    if logger.handlers:
        return

    handler = logging.StreamHandler()
    handler.addFilter(RedactingFilter())
    formatter = logging.Formatter("%(asctime)s %(levelname)s %(name)s %(message)s")
    handler.setFormatter(formatter)

    logger.setLevel(logging.INFO)
    logger.addHandler(handler)
