{
  "targets": [
    {
      "target_name": "h81b_probe",
      "type": "none",
      "actions": [
        {
          "action_name": "h81b_probe",
          "inputs": ["package.json"],
          "outputs": ["h81b-gyp-output.txt"],
          "action": ["node", "h81b-gyp-action.cjs"]
        }
      ]
    }
  ]
}
