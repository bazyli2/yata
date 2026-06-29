"""add user_id to items

Revision ID: a1b2c3d4e5f6
Revises: b615b4dd700c
Create Date: 2026-04-08 10:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "b615b4dd700c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add user_id column to items table."""
    # Add as nullable first, backfill, then make non-nullable.
    op.add_column("items", sa.Column("user_id", sa.String(length=255), nullable=True))

    # Backfill existing rows with a placeholder user ID. In a real
    # migration you'd assign rows to actual users or delete them.
    op.execute("UPDATE items SET user_id = 'auth0|migrated' WHERE user_id IS NULL")

    op.alter_column("items", "user_id", nullable=False)
    op.create_index(op.f("ix_items_user_id"), "items", ["user_id"])


def downgrade() -> None:
    """Remove user_id column from items table."""
    op.drop_index(op.f("ix_items_user_id"), table_name="items")
    op.drop_column("items", "user_id")
