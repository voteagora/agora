import { ethers } from "ethers";
import { decodeProposalData, decodeVoteParams } from "./OptimismGovernor";
import {
  decodeApplicationSchema,
  decodeBadgeholderSchema,
  decodeListSchema,
} from "./EAS";

describe("Decode Proposal Data", () => {
  it("decodes ProposalData", () => {
    const data =
      "0x00000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000de0b6b3a764000000000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000004e0000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000160000000000000000000000000000000000000000000000000000000000000000100000000000000000000000037f1d6f468d31145960523687df6af7d7ff61e3300000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000853a0d2313c000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000086f7074696f6e2031000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000014000000000000000000000000000000000000000000000000000000000000002a00000000000000000000000000000000000000000000000000000000000000002000000000000000000000000420000000000000000000000000000000000004200000000000000000000000089a44cd4e64e31e18165b348f4df41c4123e30df000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000853a0d2313c00000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000044a9059cbb00000000000000000000000037f1d6f468d31145960523687df6af7d7ff61e330000000000000000000000000000000000000000000000000853a0d2313c0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044a9059cbb00000000000000000000000037f1d6f468d31145960523687df6af7d7ff61e330000000000000000000000000000000000000000000000000853a0d2313c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000086f7074696f6e2032000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001e0000000000000000000000000000000000000000000000000000000000000000100000000000000000000000042000000000000000000000000000000000000420000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000006423b872dd0000000000000000000000006e17cdef2f7c1598ad9dfa9a8accf84b1303f43f00000000000000000000000037f1d6f468d31145960523687df6af7d7ff61e330000000000000000000000000000000000000000000000000853a0d2313c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000086f7074696f6e2033000000000000000000000000000000000000000000000000";

    const decodedProposalData = decodeProposalData(data);

    expect(decodedProposalData).toHaveProperty("proposalSettings");
    expect(decodedProposalData).toHaveProperty("proposalOptions");

    const { proposalSettings, proposalOptions } = decodedProposalData;

    // Test proposalSettings
    expect(proposalSettings).toHaveProperty("maxApprovals");
    expect(proposalSettings).toHaveProperty("criteria");
    expect(proposalSettings).toHaveProperty("budgetToken");
    expect(proposalSettings).toHaveProperty("criteriaValue");
    expect(proposalSettings).toHaveProperty("budgetAmount");

    expect(typeof proposalSettings.maxApprovals).toBe("number");
    expect(typeof proposalSettings.criteria).toBe("number");
    expect(typeof proposalSettings.budgetToken).toBe("string");
    expect(proposalSettings.criteriaValue).toBeInstanceOf(ethers.BigNumber);
    expect(proposalSettings.budgetAmount).toBeInstanceOf(ethers.BigNumber);

    // Test proposalOptions
    expect(Array.isArray(proposalOptions)).toBe(true);

    proposalOptions.forEach((option) => {
      expect(option).toHaveProperty("targets");
      expect(option).toHaveProperty("values");
      expect(option).toHaveProperty("calldatas");
      expect(option).toHaveProperty("description");

      expect(Array.isArray(option.targets)).toBe(true);
      expect(Array.isArray(option.values)).toBe(true);
      expect(Array.isArray(option.calldatas)).toBe(true);
      expect(typeof option.description).toBe("string");
    });
  });

  it("decodes VotePrams", () => {
    const data =
      "0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002";
    const decodedVoteParams = decodeVoteParams(data);

    expect(Array.isArray(decodedVoteParams)).toBe(true);

    decodedVoteParams.forEach((option) => {
      expect(typeof option).toBe("number");
    });
  });

  it("decodes BadgeholderSchema", () => {
    const data =
      "0x00000000000000000000000000000000000000000000000000000000000000600000000000000000000000005e349eca2dc61abcd9dd99ce94d04136151a09ee00000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000001320000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000124261646765686f6c6465722043686f6963650000000000000000000000000000";
    const decodedData = decodeBadgeholderSchema(data);

    expect(decodedData).toHaveProperty("rpgfRound");
    expect(decodedData).toHaveProperty("referredBy");
    expect(decodedData).toHaveProperty("referredMethod");
  });

  it("decodes ApplicationSchema", () => {
    const data =
      "0x0000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000000d43727970746f5a6f6d6269657300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006b68747470733a2f2f636f6e74656e742e6f7074696d69736d2e696f2f72706766334170706c69636174696f6e2f76302f6d657461646174612f31302f3078626231303545336336443634303641334630614142393863443844304533613132376244363433362e6a736f6e000000000000000000000000000000000000000000";
    const decodedData = decodeApplicationSchema(data);

    expect(decodedData).toHaveProperty("displayName");
    expect(decodedData).toHaveProperty("applicationMetadataPtrType");
    expect(decodedData).toHaveProperty("applicationMetadataPtr");
  });

  it("decodes ListSchema", () => {
    const data =
      "0x0000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000000d43727970746f5a6f6d6269657300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006b68747470733a2f2f636f6e74656e742e6f7074696d69736d2e696f2f72706766334170706c69636174696f6e2f76302f6d657461646174612f31302f3078626231303545336336443634303641334630614142393863443844304533613132376244363433362e6a736f6e000000000000000000000000000000000000000000";
    const decodedData = decodeListSchema(data);

    expect(decodedData).toHaveProperty("listName");
    expect(decodedData).toHaveProperty("listMetadataPtrType");
    expect(decodedData).toHaveProperty("listMetadataPtr");
  });
});
