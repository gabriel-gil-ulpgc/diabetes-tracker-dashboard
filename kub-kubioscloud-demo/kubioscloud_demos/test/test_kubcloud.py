"""Unit tests for KubCloud library"""
from unittest import TestCase

import jsons  # type: ignore

from .. import kubcloud


class ChannelSpecTestCase(TestCase):
    """Unit tests for ChannelSpec class"""

    def test_channel_spec_node_fields(self):
        """None valued fields should not be included in serialization output"""
        chs = kubcloud.ChannelSpec(index=0, type="RRI", data_enc=[["value", "H"]])
        dct = kubcloud.ChannelSpec.serializer(chs)
        self.assertIn("type", dct)
        self.assertIn("data_enc", dct)
        self.assertNotIn("label", dct)

    def test_jsons_interation(self):
        """None valued fields should not be included in jsons output"""
        chs = kubcloud.ChannelSpec(index=0, type="RRI", data_enc=[["value", "H"]])
        jsons.set_serializer(kubcloud.ChannelSpec.serializer, kubcloud.ChannelSpec)
        json_str = jsons.dumps(chs)
        self.assertIn("type", json_str)
        self.assertIn("data_enc", json_str)
        self.assertNotIn("label", json_str)


class InternalMethodsTestCase(TestCase):
    """Tests for internal helper methods."""

    def test_decode_data(self):
        """Test data decoding"""
        raw_data = b"\xdf\x03\x93\x03\x86\x053\x05\x88\x04\xe6\x04"
        expected = [
            {"value": 991},
            {"value": 915},
            {"value": 1414},
            {"value": 1331},
            {"value": 1160},
            {"value": 1254},
        ]
        actual = kubcloud._decode_data(  # pylint: disable=protected-access
            [["value", "H"]], raw_data
        )
        self.assertEqual(expected, actual)
