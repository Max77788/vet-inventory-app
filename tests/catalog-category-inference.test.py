import importlib.util
import sys
from pathlib import Path

scripts_dir = Path(__file__).parents[1] / "scripts"
sys.path.insert(0, str(scripts_dir))
source = scripts_dir / "import_catalog.py"
spec = importlib.util.spec_from_file_location("import_catalog", source)
if spec is None or spec.loader is None:
    raise RuntimeError("Could not load import_catalog.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

assert module.infer_category("Вангард Плюс 5/L") == "Вакцини"
assert module.infer_category("Еурікан вакцина DНРРІ2+L") == "Вакцини"
assert module.infer_category("Цефтіовет-50 (100мл)") == "Антибіотики"

print("catalog category inference regression checks passed")
